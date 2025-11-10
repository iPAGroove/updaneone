// assets/js/mobile-parallax.js (Исправлено для работы с .stars)

document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.vip-wrapper');
    // ИЩЕМ НОВЫЕ ЭЛЕМЕНТЫ: STARS (вместо background-deco)
    const stars = document.querySelector('.stars'); 
    
    // Проверяем, поддерживает ли устройство DeviceOrientationEvent
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (event) => {
            let tiltX = event.beta;  // Наклон вперед/назад
            let tiltY = event.gamma; // Наклон влево/вправо

            // Нормализация и ограничение (как было)
            if (tiltY > 30) tiltY = 30;
            if (tiltY < -30) tiltY = -30;
            if (tiltX > 30) tiltX = 30;
            if (tiltX < -30) tiltX = -30;

            const normalizedY = tiltY / 30;
            const normalizedX = tiltX / 30;

            // wrapper (ближе, глубина 0.3) - движется немного в противофазе
            if (wrapper) { // Добавим проверку, на всякий случай
                wrapper.style.transform = `translate3d(${normalizedY * 10}px, ${normalizedX * 10}px, 0)`;
            }

            // stars (дальше, глубина 0.1) - движется больше
            if (stars) { // Ищем stars вместо deco
                stars.style.transform = `translate3d(${normalizedY * -30}px, ${normalizedX * -30}px, 0)`;
            }

        }, true);
    } 
    
    // Параллакс для курсора (для десктопов)
    else {
        document.addEventListener('mousemove', (e) => {
            const mouseX = (e.clientX / window.innerWidth - 0.5) * 2; 
            const mouseY = (e.clientY / window.innerHeight - 0.5) * 2; 

            if (wrapper) {
                wrapper.style.transform = `translate3d(${mouseX * -10}px, ${mouseY * -10}px, 0)`;
            }

            if (stars) { // Ищем stars вместо deco
                stars.style.transform = `translate3d(${mouseX * 25}px, ${mouseY * 25}px, 0)`;
            }
        });
    }
});
