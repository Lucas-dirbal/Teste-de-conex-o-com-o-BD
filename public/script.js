document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerScreen = document.getElementById('register-screen');
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    const showLoginBtn = document.getElementById('show-login-btn');
    const logoBtn = document.getElementById('logo-btn');
    const registerForm = document.getElementById('register-form');
    const newUserForm = document.getElementById('new-user-form');
    const userList = document.getElementById('user-list');

    // Simula banco de usuários
    const users = [];

    // Login padrão
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        if(user === 'Admin' && pass === '1234') {
            alert('Login admin realizado com sucesso!');
            loginScreen.classList.add('hidden');
            dashboard.classList.remove('hidden');
            updateUserList();
        } else {
            alert('Usuário ou senha incorretos!');
        }
    });

    // Alternar para login
    showLoginBtn.addEventListener('click', () => {
        registerScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    });

    // Logo especial abre tela de cadastro
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

    // Cadastro de usuário pelo menu escondido
    registerForm.addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;

        users.push({ username, password, role });
        alert(`Usuário ${username} cadastrado com sucesso!`);
        registerForm.reset();
    });

    // Criar novo usuário pelo dashboard
    newUserForm.addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('new-username').value;
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('new-role').value;

        users.push({ username, password, role });
        alert(`Usuário ${username} cadastrado com sucesso!`);
        newUserForm.reset();
        updateUserList();
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        dashboard.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    });

    function updateUserList() {
        if(users.length === 0) {
            userList.innerHTML = 'Nenhum usuário cadastrado';
        } else {
            userList.innerHTML = users.map(u => `<div class="p-2 border rounded">${u.username} - ${u.role}</div>`).join('');
        }
    }
});
