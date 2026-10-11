# Smart Garbage Monitoring System

An IoT-based project that monitors garbage-bin fill levels using an ESP32
and an ultrasonic sensor. A web dashboard displays fill levels, bin status,
and alerts when a bin is almost full.

## Features

- ESP32 and HC-SR04 ultrasonic sensor simulation using Wokwi
- Garbage-bin fill-level calculation
- LED warning indicator
- Web dashboard with fill-level progress bars
- Automatic alerts when a bin reaches 80% capacity
- Fill-level history chart
- Python Flask backend API

## Technologies Used

- C++
- ESP32
- HC-SR04 ultrasonic sensor
- HTML, CSS, JavaScript
- Python and Flask
- Chart.js
- Wokwi

## Project Structure

```text
garbage-monitoring-system/
├── app.py
├── index.html
├── requirements.txt
└── static/
    └── app.js
