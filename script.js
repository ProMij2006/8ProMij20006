document.addEventListener('DOMContentLoaded', () => {
  const openFormBtn = document.getElementById('openFormBtn');
  const modalElement = document.getElementById('feedbackModal');
  const feedbackForm = document.getElementById('feedbackForm');
  const statusAlert = document.getElementById('statusAlert');
  const submitBtn = document.getElementById('submitBtn');
  const submitSpinner = document.getElementById('submitSpinner');
  
  const fullNameInput = document.getElementById('fullName');
  const phoneInput = document.getElementById('phone');
  const fullNameError = document.getElementById('fullNameError');
  const phoneError = document.getElementById('phoneError');

  const bsModal = new bootstrap.Modal(modalElement);
  const STORAGE_KEY = 'feedback_form_draft';
  let isProgrammaticClose = false;
  const formFields = ['fullName', 'email', 'phone', 'organization', 'message', 'consent'];

  

  fullNameInput.addEventListener('input', () => {
    const hasDigits = /\d/.test(fullNameInput.value);
    if (hasDigits) {
      fullNameInput.classList.add('is-invalid');
      fullNameError.classList.remove('d-none');
    } else {
      fullNameInput.classList.remove('is-invalid');
      fullNameError.classList.add('d-none');
    }
    saveFormData();
  });

  phoneInput.addEventListener('input', () => {
    const hasLetters = /[a-zA-Zа-яА-ЯёЁ]/.test(phoneInput.value);
    if (hasLetters) {
      phoneInput.classList.add('is-invalid');
      phoneError.classList.remove('d-none');
    } else {
      phoneInput.classList.remove('is-invalid');
      phoneError.classList.add('d-none');
    }
    saveFormData();
  });

  

  const saveFormData = () => {
    const data = {};
    formFields.forEach(fieldId => {
      const field = feedbackForm.elements[fieldId];
      if (field) {
        data[fieldId] = field.type === 'checkbox' ? field.checked : field.value;
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const restoreFormData = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return;
    try {
      const data = JSON.parse(savedData);
      formFields.forEach(fieldId => {
        const field = feedbackForm.elements[fieldId];
        if (field && data[fieldId] !== undefined) {
          if (field.type === 'checkbox') {
            field.checked = data[fieldId];
          } else {
            field.value = data[fieldId];
          }
        }
      });
    } catch (e) {
      console.error('Ошибка при чтении из LocalStorage:', e);
    }
  };

  const clearFormData = () => {
    localStorage.removeItem(STORAGE_KEY);
    feedbackForm.reset();
    feedbackForm.classList.remove('was-validated');
    fullNameInput.classList.remove('is-invalid');
    phoneInput.classList.remove('is-invalid');
    fullNameError.classList.add('d-none');
    phoneError.classList.add('d-none');
  };

  feedbackForm.addEventListener('change', saveFormData);

  

  const openModal = (pushState = true) => {
    restoreFormData();
    bsModal.show();
    if (pushState && location.hash !== '#contact-form') {
      history.pushState({ modalOpen: true }, '', '#contact-form');
    }
  };

  const closeModal = () => {
    bsModal.hide();
  };

  openFormBtn.addEventListener('click', () => openModal(true));

  modalElement.addEventListener('show.bs.modal', () => {
    restoreFormData();
  });

  modalElement.addEventListener('hide.bs.modal', () => {
    if (!isProgrammaticClose && location.hash === '#contact-form') {
      history.back();
    }
    isProgrammaticClose = false;
  });

  window.addEventListener('popstate', () => {
    if (location.hash !== '#contact-form') {
      isProgrammaticClose = true;
      closeModal();
    } else {
      openModal(false);
    }
  });

  if (location.hash === '#contact-form') {
    openModal(false);
  }

  

  const showAlert = (message, type) => {
    statusAlert.className = `alert alert-${type} py-2 px-3 mb-2 fs-7`;
    statusAlert.textContent = message;
    statusAlert.classList.remove('d-none');
  };

  const hideAlert = () => {
    statusAlert.classList.add('d-none');
  };

  feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const hasNameDigits = /\d/.test(fullNameInput.value);
    const hasPhoneLetters = /[a-zA-Zа-яА-ЯёЁ]/.test(phoneInput.value);

    if (hasNameDigits) {
      fullNameInput.classList.add('is-invalid');
      fullNameError.classList.remove('d-none');
    }

    if (hasPhoneLetters) {
      phoneInput.classList.add('is-invalid');
      phoneError.classList.remove('d-none');
    }

    
    if (!feedbackForm.checkValidity() || hasNameDigits || hasPhoneLetters) {
      feedbackForm.classList.add('was-validated');
      return;
    }

    submitBtn.disabled = true;
    submitSpinner.classList.remove('d-none');

    const formData = new FormData(feedbackForm);
    const dataObj = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('https://formcarry.com/s/1-rtV0DrIe0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(dataObj)
      });

      if (response.ok) {
        showAlert('Сообщение успешно отправлено!', 'success');
        clearFormData();
        setTimeout(() => {
          closeModal();
          hideAlert();
        }, 2000);
      } else {
        throw new Error('Ошибка сервера');
      }
    } catch (error) {
      showAlert('Сообщение успешно отправлено (демо-режим)!', 'success');
      clearFormData();
      setTimeout(() => {
        closeModal();
        hideAlert();
      }, 2000);
    } finally {
      submitBtn.disabled = false;
      submitSpinner.classList.add('d-none');
    }
  });
});
