# Casa Abierta

This is the website for the Escuela Superior Ocupacional Pablo Colón Berdecia's "Casa Abierta" event, showcasing various vocational programs offered by the school.

## Programs Featured
- Computec (Computing)
- Mercadeo (Marketing)
- Enfermería (Nursing)
- Cosmetología (Cosmetology)
- Artes Culinarias (Culinary Arts)
- Elaboración de Productos Agrícolas (Agricultural Product Processing)
- Seguridad Pública (Public Security)

## Technologies Used
- HTML5
- CSS3 (Bootstrap 5)
- JavaScript (EmailJS for contact forms)
- Font Awesome for icons

## Setup
Simply open `index.html` in a web browser to view the site. No server required for basic functionality.

## Admin Features
There is an admin login (`admin-login.html`) with hardcoded credentials (security issue noted). Admin panel allows managing content.

## Security Notes
- Admin credentials are exposed in client-side code.
- EmailJS keys are visible; consider moving to server-side.