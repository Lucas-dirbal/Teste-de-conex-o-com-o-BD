document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerScreen = document.getElementById('register-screen');
    const loginScreen = document.getElementById('login-screen');
    const showLoginBtn = document.getElementById('show-login-btn');
    const logoBtn = document.getElementById('logo-btn');

    // Login padrão
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        if(user === 'Admin' && pass === '1234') {
            alert('Login admin realizado com sucesso!');
            loginScreen.classList.add('hidden');
            // Pode chamar dashboard aqui
        } else {
            alert('Usuário ou senha incorretos!');
        }
    });

    // Alternar para login
    showLoginBtn.addEventListener('click', () => {
        registerScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    });

    // Logo especial abre cadastro
    logoBtn.addEventListener('click', () => {
        const usuario = prompt('Digite o usuário para acessar o cadastro:');
        const senha = prompt('Digite a senha:');
        if(usuario === 'Admin' && senha === '1234') {
            loginScreen.classList.add('hidden');
            registerScreen.classList.remove('hidden');
        } else {
            alert('Credenciais inválidas!');
        }
    });
});
