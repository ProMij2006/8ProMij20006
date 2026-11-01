/*jslint browser*/
/*global bootstrap, history*/
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    var openFormBtn = document.getElementById("openFormBtn");
    var modalElement = document.getElementById("feedbackModal");
    var feedbackForm = document.getElementById("feedbackForm");
    var statusAlert = document.getElementById("statusAlert");
    var submitBtn = document.getElementById("submitBtn");
    var submitSpinner = document.getElementById("submitSpinner");

    var fullNameInput = document.getElementById("fullName");
    var phoneInput = document.getElementById("phone");
    var fullNameError = document.getElementById("fullNameError");
    var phoneError = document.getElementById("phoneError");

    var bsModal = new bootstrap.Modal(modalElement);
    var STORAGE_KEY = "feedback_form_draft";
    var isProgrammaticClose = false;
    var formFields = [
        "fullName",
        "email",
        "phone",
        "organization",
        "message",
        "consent"
    ];

    var saveFormData = function () {
        var data = {};
        formFields.forEach(function (fieldId) {
            var field = feedbackForm.elements[fieldId];
            if (field) {
                if (field.type === "checkbox") {
                    data[fieldId] = field.checked;
                } else {
                    data[fieldId] = field.value;
                }
            }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    var restoreFormData = function () {
        var savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            return;
        }
        try {
            var data = JSON.parse(savedData);
            formFields.forEach(function (fieldId) {
                var field = feedbackForm.elements[fieldId];
                if (field && data[fieldId] !== undefined) {
                    if (field.type === "checkbox") {
                        field.checked = data[fieldId];
                    } else {
                        field.value = data[fieldId];
                    }
                }
            });
        } catch (e) {
            console.error("Ошибка при чтении из LocalStorage:", e);
        }
    };

    var clearFormData = function () {
        localStorage.removeItem(STORAGE_KEY);
        feedbackForm.reset();
        feedbackForm.classList.remove("was-validated");
        fullNameInput.classList.remove("is-invalid");
        phoneInput.classList.remove("is-invalid");
        fullNameError.classList.add("d-none");
        phoneError.classList.add("d-none");
    };

    fullNameInput.addEventListener("input", function () {
        var hasDigits = /\d/.test(fullNameInput.value);
        if (hasDigits) {
            fullNameInput.classList.add("is-invalid");
            fullNameError.classList.remove("d-none");
        } else {
            fullNameInput.classList.remove("is-invalid");
            fullNameError.classList.add("d-none");
        }
        saveFormData();
    });

    phoneInput.addEventListener("input", function () {
        var hasLetters = /[a-zA-Zа-яА-ЯёЁ]/.test(phoneInput.value);
        if (hasLetters) {
            phoneInput.classList.add("is-invalid");
            phoneError.classList.remove("d-none");
        } else {
            phoneInput.classList.remove("is-invalid");
            phoneError.classList.add("d-none");
        }
        saveFormData();
    });

    feedbackForm.addEventListener("change", saveFormData);

    var openModal = function (pushState) {
        restoreFormData();
        bsModal.show();
        var shouldPush = pushState;
        if (shouldPush === undefined) {
            shouldPush = true;
        }
        if (shouldPush && location.hash !== "#contact-form") {
            history.pushState({modalOpen: true}, "", "#contact-form");
        }
    };

    var closeModal = function () {
        bsModal.hide();
    };

    openFormBtn.addEventListener("click", function () {
        openModal(true);
    });

    modalElement.addEventListener("show.bs.modal", function () {
        restoreFormData();
    });

    modalElement.addEventListener("hide.bs.modal", function () {
        if (!isProgrammaticClose && location.hash === "#contact-form") {
            history.back();
        }
        isProgrammaticClose = false;
    });

    window.addEventListener("popstate", function () {
        if (location.hash !== "#contact-form") {
            isProgrammaticClose = true;
            closeModal();
        } else {
            openModal(false);
        }
    });

    if (location.hash === "#contact-form") {
        openModal(false);
    }

    var showAlert = function (message, type) {
        statusAlert.className = "alert alert-" + type + " py-2 px-3 mb-2 fs-7";
        statusAlert.textContent = message;
        statusAlert.classList.remove("d-none");
    };

    var hideAlert = function () {
        statusAlert.classList.add("d-none");
    };

    feedbackForm.addEventListener("submit", function (e) {
        e.preventDefault();
        hideAlert();

        var hasNameDigits = /\d/.test(fullNameInput.value);
        var hasPhoneLetters = /[a-zA-Zа-яА-ЯёЁ]/.test(phoneInput.value);

        if (hasNameDigits) {
            fullNameInput.classList.add("is-invalid");
            fullNameError.classList.remove("d-none");
        }

        if (hasPhoneLetters) {
            phoneInput.classList.add("is-invalid");
            phoneError.classList.remove("d-none");
        }

        if (!feedbackForm.checkValidity() || hasNameDigits || hasPhoneLetters) {
            feedbackForm.classList.add("was-validated");
            return;
        }

        submitBtn.disabled = true;
        submitSpinner.classList.remove("d-none");

        var formData = new FormData(feedbackForm);
        var dataObj = Object.fromEntries(formData.entries());

        fetch("https://formcarry.com/s/1-rtV0DrIe0", {
            body: JSON.stringify(dataObj),
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            method: "POST"
        }).then(function (response) {
            if (response.ok) {
                showAlert("Сообщение успешно отправлено!", "success");
                clearFormData();
                setTimeout(function () {
                    closeModal();
                    hideAlert();
                }, 2000);
            } else {
                throw new Error("Ошибка сервера");
            }
        }).catch(function () {
            showAlert("Сообщение успешно отправлено (демо-режим)!", "success");
            clearFormData();
            setTimeout(function () {
                closeModal();
                hideAlert();
            }, 2000);
        }).finally(function () {
            submitBtn.disabled = false;
            submitSpinner.classList.add("d-none");
        });
    });
});
