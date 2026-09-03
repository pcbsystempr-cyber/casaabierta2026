// scripts.js - Manejo básico de formularios y mensajes

document.addEventListener('DOMContentLoaded', () => {
    // Language switching
    const currentLang = localStorage.getItem('lang') || 'es';
    setLanguage(currentLang);

    document.querySelectorAll('[data-lang]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = e.target.getAttribute('data-lang');
            setLanguage(lang);
            localStorage.setItem('lang', lang);
        });
    });

    function setLanguage(lang) {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-' + lang + ']').forEach(element => {
            element.textContent = element.getAttribute('data-' + lang);
        });
        // Handle placeholders
        document.querySelectorAll('[data-' + lang + '-placeholder]').forEach(element => {
            element.placeholder = element.getAttribute('data-' + lang + '-placeholder');
        });
    }
});
