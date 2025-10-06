document.addEventListener('DOMContentLoaded', () => {
    const passwordIcon = document.querySelector("#password-icon");
    const repeatPasswordIcon = document.querySelector("#repeat-password-icon");
    const passwordInput = document.querySelector("#Password");
    const repeatPasswordInput = document.querySelector("#repeat-password");
    const registerForm = document.querySelector("#register-form");
    const googleBtn = document.querySelector(".btn-google");
    const facebookBtn = document.querySelector(".btn-facebook");

    // Toggle password visibility
    passwordIcon.addEventListener("click", (e) => togglePasswordVisibility(e.target, passwordInput));
    repeatPasswordIcon.addEventListener("click", (e) => togglePasswordVisibility(e.target, repeatPasswordInput));

    function togglePasswordVisibility(icon, input) {
        if(icon.getAttribute("data-open")=="false"){
            icon.src="assets/svg/eye-closed.svg";
            icon.setAttribute('data-open', 'true');
            input.type = "text";
        }else{
            icon.src="assets/svg/eye-open.svg";
            icon.setAttribute('data-open', 'false');
            input.type = "password";
        }
    }

    // Función para mostrar mensaje de error
    function showError(input, message) {
        // Remover error previo si existe
        removeError(input);
        
        // Crear elemento de error
        const errorMsg = document.createElement('p');
        errorMsg.className = 'error-message body-b3';
        errorMsg.textContent = message;
        
        // Agregar clase de error al input
        input.classList.add('input-error');
        
        // Encontrar el contenedor padre (.input-label)
        const parent = input.closest('.input-label');
        
        // Insertar el mensaje al final del contenedor
        if(parent) {
            parent.appendChild(errorMsg);
        }
    }

    // Función para remover mensaje de error
    function removeError(input) {
        const parent = input.closest('.input-label');
        if(parent) {
            const errorMsg = parent.querySelector('.error-message');
            if(errorMsg) {
                errorMsg.remove();
            }
        }
        input.classList.remove('input-error');
    }

    // Limpiar errores cuando el usuario empiece a escribir
    passwordInput.addEventListener('input', () => removeError(passwordInput));
    repeatPasswordInput.addEventListener('input', () => removeError(repeatPasswordInput));

    // Handle register form submission
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        let isValid = true;

        // Validar contraseña (mínimo 8 caracteres, 1 letra y 1 número)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
        if(!passwordRegex.test(passwordInput.value)) {
            showError(passwordInput, "La contraseña debe tener mínimo 8 caracteres, 1 letra y 1 número");
            isValid = false;
        }

        // Validar que las contraseñas coincidan
        if(passwordInput.value !== repeatPasswordInput.value) {
            showError(repeatPasswordInput, "Las contraseñas no coinciden");
            isValid = false;
        }

        // Si todo está correcto, redirigir al index
        if(isValid) {
            window.location.href = "index.html";
        }
    });

    // Handle Google button click
    googleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "index.html";
    });

    // Handle Facebook button click
    facebookBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "index.html";
    });
});