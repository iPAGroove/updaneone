from flask import Flask, request, redirect, Response
import re

app = Flask(__name__)

# Замени на URL своего сайта (на GitHub Pages)
FRONTEND_URL = "https://твой-домен.com/" 
# Замени на URL твоего Python-сервера
BACKEND_URL = "https://твой-python-сервер.com/receive_udid" 

@app.route('/enroll')
def enroll():
    """Отдает устройству файл .mobileconfig"""
    
    mobileconfig_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
        <key>PayloadContent</key>
        <dict>
            <key>URL</key>
            <string>{BACKEND_URL}</string> <key>DeviceAttributes</key>
            <array>
                <string>UDID</string>
                <string>IMEI</string>
                <string>VERSION</string>
            </array>
        </dict>
        <key>PayloadOrganization</key>
        <string>My UDID Service</string>
        <key>PayloadDisplayName</key>
        <string>UDID Enrollment</string>
        <key>PayloadVersion</key>
        <integer>1</integer>
        <key>PayloadUUID</key>
        <string>9C43E0D1-2EE3-4886-9A10-BE58A2462A0D</string> <key>PayloadIdentifier</key>
        <string>com.myudidservice.profile</string>
        <key>PayloadDescription</key>
        <string>Профиль для получения UDID</string>
        <key>PayloadType</key>
        <string>Profile Service</string>
    </dict>
    </plist>
    """
    
    # Apple требует специфичный Content-Type для установки профиля
    return Response(mobileconfig_xml, mimetype='application/x-apple-aspen-config')

@app.route('/receive_udid', methods=['POST'])
def receive_udid():
    """Принимает данные от устройства и делает редирект обратно на фронтенд"""
    
    data = request.get_data()
    
    # Данные от Apple приходят подписанными (PKCS7), внутри лежит XML (Plist).
    # Для MVP используем регулярку, чтобы вытащить UDID прямо из бинарника.
    udid_match = re.search(b'<key>UDID</key>.*?<string>(.*?)</string>', data, re.DOTALL)
    
    if udid_match:
        udid = udid_match.group(1).decode('utf-8')
        # Делаем редирект пользователя обратно на твой красивый сайт, передавая UDID в URL
        return redirect(f"{FRONTEND_URL}?udid={udid}", code=301)
    else:
        return "Ошибка: UDID не найден", 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
