import socket
import pymysql
import os
from dotenv import load_dotenv

# Database configuration
load_dotenv()
db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASS'),
    'database': os.getenv('DB_NAME'),
}

# UDP configuration
UDP_IP = '0.0.0.0'  # Listen on all interfaces
UDP_PORT = 5000

# Create UDP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))

# Establish database connection
conn = pymysql.connect(**db_config)
cursor = conn.cursor()

def insert_location(lat, lon, timestamp):
    try:
        sql = "INSERT INTO locations (latitude, longitude, timestamp) VALUES (%s, %s, %s)"
        cursor.execute(sql, (lat, lon, timestamp))
        conn.commit()
    except pymysql.MySQLError as e:
        print(f"Error: {e}")
        conn.rollback()

print(f"Listening on UDP port {UDP_PORT}...")

while True:
    data, addr = sock.recvfrom(1024)  # Buffer size is 1024 bytes
    message = data.decode('utf-8')
    try:
        lat, lon, timestamp = message.split(';')
        lat = lat.replace(',', '.')
        lon = lon.replace(',', '.')
        insert_location(lat, lon, timestamp)
        print(f"Inserted location: Latitude={lat}, Longitude={lon}, Timestamp={timestamp}")
    except ValueError:
        print("Received invalid data format")
    except Exception as e:
        print(f"Error processing message: {e}")

# Close database connection
cursor.close()
conn.close()
