import mysql.connector

def reset_db():
    print("Connecting to local MySQL database...")
    try:
        conn = mysql.connector.connect(
            host='localhost',
            port=3306,
            user='root',
            password='root',
            database='disaster_alert'
        )
        cursor = conn.cursor()
        
        print("Disabling foreign key checks...")
        cursor.execute("SET FOREIGN_KEY_CHECKS=0;")
        
        tables_to_truncate = ['reputation_event', 'votes', 'resources', 'alerts']
        for table in tables_to_truncate:
            print(f"Truncating table: {table}...")
            cursor.execute(f"TRUNCATE TABLE {table};")
            
        print("Enabling foreign key checks...")
        cursor.execute("SET FOREIGN_KEY_CHECKS=1;")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Demo state wiped successfully!")
        print("Preserved structural data: users, alert_types, resource_types.")
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == '__main__':
    reset_db()
