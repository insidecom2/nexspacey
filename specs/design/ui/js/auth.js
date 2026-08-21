/* login.html + register.html — demo-only client-side validation & role handoff. */

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const toggleBtn = document.getElementById('toggle-password');
  toggleBtn.addEventListener('click', () => {
    const input = document.getElementById('password');
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    toggleBtn.setAttribute('aria-pressed', String(!showing));
    toggleBtn.setAttribute('aria-label', showing ? 'แสดงรหัสผ่าน' : 'ซ่อนรหัสผ่าน');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const emailValid = /\S+@\S+\.\S+/.test(email.value);
    const passwordValid = password.value.length > 0;
    showFieldError(document.getElementById('email-group'), !emailValid);
    showFieldError(document.getElementById('password-group'), !passwordValid);
    if (!emailValid) { email.focus(); return; }
    if (!passwordValid) { password.focus(); return; }

    const btn = document.getElementById('login-submit');
    setButtonLoading(btn, true);
    setTimeout(() => {
      Store.setRole('candidate');
      window.location.href = 'index.html';
    }, 700);
  });
}

function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  const companyField = document.getElementById('company-field');
  const companyInput = document.getElementById('companyname');
  form.querySelectorAll('input[name="account-role"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      companyField.hidden = radio.value !== 'employer' || !radio.checked;
      document.querySelectorAll('input[name="account-role"]').forEach((r) => {
        r.closest('label').style.borderColor = r.checked ? 'var(--color-primary)' : 'var(--color-border)';
      });
    });
  });
  document.querySelectorAll('input[name="account-role"]').forEach((r) => {
    if (r.checked) r.dispatchEvent(new Event('change'));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const role = form.querySelector('input[name="account-role"]:checked').value;
    const fullname = document.getElementById('fullname');
    const email = document.getElementById('reg-email');
    const password = document.getElementById('reg-password');
    const agree = document.getElementById('agree');

    let valid = true;
    const nameValid = fullname.value.trim().length > 0;
    showFieldError(fullname.closest('.form-group'), !nameValid);
    valid = valid && nameValid;

    if (role === 'employer') {
      const companyValid = companyInput.value.trim().length > 0;
      showFieldError(companyField, !companyValid);
      valid = valid && companyValid;
    }

    const emailValid = /\S+@\S+\.\S+/.test(email.value);
    showFieldError(email.closest('.form-group'), !emailValid);
    valid = valid && emailValid;

    const passwordValid = password.value.length >= 8;
    showFieldError(password.closest('.form-group'), !passwordValid);
    valid = valid && passwordValid;

    const agreeValid = agree.checked;
    showFieldError(agree.closest('.form-group'), !agreeValid);
    valid = valid && agreeValid;

    if (!valid) {
      const firstError = form.querySelector('.has-error .form-control, .has-error input');
      if (firstError) firstError.focus();
      return;
    }

    const btn = document.getElementById('register-submit');
    setButtonLoading(btn, true);
    setTimeout(() => {
      Store.setRole(role);
      window.location.href = role === 'employer' ? 'employer-dashboard.html' : 'index.html';
    }, 700);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
});
