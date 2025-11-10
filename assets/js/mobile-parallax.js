// assets/js/mobile-parallax.js (Работает на iPhone через акселерометр)

document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.vip-wrapper');
    const deco = document.querySelector('.background-deco');

    // Проверяем, поддерживает ли устройство DeviceOrientationEvent
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (event) => {
            let tiltX = event.beta;  // Наклон вперед/назад
            let tiltY = event.gamma; // Наклон влево/вправо

            // Нормализуем значения (для iOS tiltX обычно от -180 до 180, tiltY от -90 до 90)
            // Ограничиваем диапазон, чтобы эффект не был слишком резким
            if (tiltY > 30) tiltY = 30;
            if (tiltY < -30) tiltY = -30;
            if (tiltX > 30) tiltX = 30;
            if (tiltX < -30) tiltX = -30;

            // Конвертируем в более простое значение (от -1 до 1)
            const normalizedY = tiltY / 30;
            const normalizedX = tiltX / 30;

            // wrapper (ближе, глубина 0.3) - движется немного в противофазе
            wrapper.style.transform = `translate3d(${normalizedY * 10}px, ${normalizedX * 10}px, 0)`;

            // deco (дальше, глубина 0.1) - движется больше, создавая ощущение глубины
            deco.style.transform = `translate3d(${normalizedY * -30}px, ${normalizedX * -30}px, 0)`;

        }, true);
    } 
    
    // Если это не мобильное устройство, можно добавить базовый параллакс для курсора:
    else {
        document.addEventListener('mousemove', (e) => {
            const mouseX = (e.clientX / window.innerWidth - 0.5) * 2; // От -1 до 1
            const mouseY = (e.clientY / window.innerHeight - 0.5) * 2; 

            // wrapper
            wrapper.style.transform = `translate3d(${mouseX * -10}px, ${mouseY * -10}px, 0)`;

            // deco
            deco.style.transform = `translate3d(${mouseX * 25}px, ${mouseY * 25}px, 0)`;
        });
    }
});
