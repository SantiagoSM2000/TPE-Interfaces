document.addEventListener('DOMContentLoaded', () => {
    const passwordIcon = document.querySelector("#password-icon");
    const repeatPasswordIcon = document.querySelector("#repeat-password-icon");
    const passwordInput = document.querySelector("#Password");
    const repeatPasswordInput = document.querySelector("#repeat-password");
    const registerForm = document.querySelector("#register-form");
    const googleBtn = document.querySelector(".btn-google");
    const facebookBtn = document.querySelector(".btn-facebook");

    // Desactivar validación HTML5 nativa
    registerForm.setAttribute('novalidate', '');

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

    // Limpiar errores cuando el usuario empiece a escribir en cualquier input
    const allInputs = registerForm.querySelectorAll('input');
    allInputs.forEach(input => {
        input.addEventListener('input', () => removeError(input));
    });

    // Manejar el envío del formulario de registro
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        let isValid = true;

        // Obtengo todos los campos requeridos
        const nameInput = document.querySelector("#name");
        const lastNameInput = document.querySelector("#last-name");
        const ageInput = document.querySelector("#age");
        const emailInput = document.querySelector("#Email");

        // Validar campos requeridos
        if(!nameInput.value.trim()) {
            showError(nameInput, "El nombre es requerido");
            isValid = false;
        }

        if(!lastNameInput.value.trim()) {
            showError(lastNameInput, "El apellido es requerido");
            isValid = false;
        }

        if(!ageInput.value) {
            showError(ageInput, "La fecha de nacimiento es requerida");
            isValid = false;
        }

        if(!emailInput.value.trim()) {
            showError(emailInput, "El email es requerido");
            isValid = false;
        } else {
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if(!emailRegex.test(emailInput.value)) {
                showError(emailInput, "El email no es válido");
                isValid = false;
            }
        }

        // Validar que la contraseña no esté vacía
        if(!passwordInput.value) {
            showError(passwordInput, "La contraseña es requerida");
            isValid = false;
        } 
        // Validar longitud mínima de 8 caracteres
        else if(passwordInput.value.length < 8) {
            showError(passwordInput, "La contraseña debe tener mínimo 8 caracteres");
            isValid = false;
        }
        // Validar que tenga al menos 1 letra y 1 número
        else {
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)/;
            if(!passwordRegex.test(passwordInput.value)) {
                showError(passwordInput, "La contraseña debe tener al menos 1 letra y 1 número");
                isValid = false;
            }
        }

        // Validar que repita la contraseña
        if(!repeatPasswordInput.value) {
            showError(repeatPasswordInput, "Debes repetir la contraseña");
            isValid = false;
        }
        // Validar que las contraseñas coincidan
        else if(passwordInput.value !== repeatPasswordInput.value) {
            showError(repeatPasswordInput, "Las contraseñas no coinciden");
            isValid = false;
        }

        // Si todo está correcto, redirigir al index
        if(isValid) {
            window.location.href = "index.html";
        }
    });

    // Boton continuar con Google
    googleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "index.html";
    });

    // Boton continuar con Facebook
    facebookBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "index.html";
    });
});