import sqlite3
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Створення бази даних та таблиці
def init_db():
    conn = sqlite3.connect('data.db')
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS records
                      (id INTEGER PRIMARY KEY AUTOINCREMENT,
                       date TEXT,
                       address TEXT,
                       amount REAL)''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add', methods=['POST'])
def add_record():
    data = request.get_json()
    conn = sqlite3.connect('data.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO records (date, address, amount) VALUES (?, ?, ?)",
                   (data['date'], data['address'], data['amount']))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/records', methods=['GET'])
def get_records():
    conn = sqlite3.connect('data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM records")
    records = cursor.fetchall()
    conn.close()
    return jsonify(records)

@app.route('/delete/<int:id>', methods=['DELETE'])
def delete_record(id):
    conn = sqlite3.connect('data.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM records WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/update/<int:id>', methods=['PUT'])
def update_record(id):
    data = request.get_json()
    conn = sqlite3.connect('data.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE records SET date=?, address=?, amount=? WHERE id=?",
                   (data['date'], data['address'], data['amount'], id))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)

import csv
from datetime import datetime
from flask import send_file

@app.route('/generate-report')
def generate_report():
    # Отримуємо всі записи за поточний місяць
    current_month = datetime.now().strftime('%Y-%m')
    records = get_records_for_month(current_month)

    # Створюємо CSV файл
    report_file = f'report_{current_month}.csv'
    with open(report_file, 'w', newline='') as csvfile:
        fieldnames = ['Дата', 'Адреса', 'Сума', 'Статус']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for record in records:
            writer.writerow({
                'Дата': record['date'],
                'Адреса': record['address'],
                'Сума': record['amount'],
                'Статус': 'Оплачено' if record['paid'] else 'Не оплачено'
            })

    return send_file(report_file, as_attachment=True)

import shutil
from datetime import datetime

@app.route('/backup')
def backup():
    backup_file = f'backup_{datetime.now().strftime("%Y%m%d%H%M%S")}.db'
    shutil.copyfile('database.db', f'backups/{backup_file}')
    return 'Backup completed successfully'
