#!/usr/bin/env python3
"""
Migration script to add AI recommendation features to seats table
Adds: has_ac, view_quality, famous_occupant, pros, cons
"""

import sqlite3
import os
import random

def get_db_path():
    """Get the database path"""
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'seats.db')

def check_column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table"""
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [row[1] for row in cursor.fetchall()]
    return column_name in columns

def add_columns(conn):
    """Add new columns to seats table"""
    cursor = conn.cursor()

    columns_to_add = [
        ('has_ac', 'INTEGER DEFAULT 0'),
        ('view_quality', 'INTEGER DEFAULT 5'),
        ('famous_occupant', 'TEXT'),
        ('pros', 'TEXT'),
        ('cons', 'TEXT')
    ]

    for col_name, col_definition in columns_to_add:
        if not check_column_exists(cursor, 'seats', col_name):
            print(f"Adding column: {col_name}")
            cursor.execute(f'ALTER TABLE seats ADD COLUMN {col_name} {col_definition}')
        else:
            print(f"Column {col_name} already exists, skipping...")

    conn.commit()

def get_seat_metadata(layer, side, position, seat_type):
    """Generate metadata for a seat based on its location"""

    # Famous people database - mapped to specific seats
    famous_people = {
        # Front premium seats (perpendicular_front)
        (6, None, 5): "A Nobel Prize laureate sat here during the 2019 ceremony",
        (6, None, 6): "A world-renowned conductor occupied this seat for opening night",
        (7, None, 1): "The venue's founder preferred this seat for important performances",
        (7, None, 8): "An Olympic gold medalist watched the finals from here",
        (8, None, 4): "A famous film director was known to choose this location",

        # Top regular seats
        (1, 'left', 3): "A bestselling author sat here during the literary festival",
        (1, 'right', 7): "The mayor attended the inaugural event in this seat",
        (2, 'left', 5): "A tech entrepreneur regularly attends from this location",
        (2, 'right', 2): "A celebrated artist chose this seat for the gallery opening",
        (3, 'left', 9): "A renowned architect frequented this spot",

        # Bottom regular seats
        (11, 'left', 4): "A legendary performer watched from this seat",
        (11, 'right', 6): "The venue's founding patron sat here for 40 years",
        (12, 'left', 1): "An inspiring educator who mentored thousands occupied this seat",
    }

    # AC coverage - better in front and middle sections
    has_ac = 0
    if seat_type == 'perpendicular_front':
        has_ac = 1  # All perpendicular front seats have AC
    elif seat_type == 'regular_top' and layer <= 3:
        has_ac = 1  # First 3 rows of top seats have AC
    elif seat_type == 'regular_bottom' and layer >= 12:
        has_ac = 1  # Last 4 rows of bottom seats have AC
    elif seat_type == 'regular_top' and layer == 4 and position <= 5:
        has_ac = 1  # Some seats in row 4 have AC

    # View quality (1-10)
    view_quality = 5  # Default

    if seat_type == 'perpendicular_front':
        # Premium front seats - best views
        if layer == 6:
            view_quality = 10
        elif layer == 7:
            view_quality = 9
        elif layer == 8:
            view_quality = 8
        else:
            view_quality = 7
    elif seat_type == 'regular_top':
        # Top regular seats - decreasing quality as you go back
        view_quality = 8 - (layer - 1)  # Layer 1=8, Layer 2=7, etc.
        # Center positions have better view
        if 4 <= position <= 7:
            view_quality += 1
    elif seat_type == 'regular_bottom':
        # Bottom regular seats
        view_quality = 7 - (layer - 11)  # Layer 11=7, Layer 12=6, etc.
        if 4 <= position <= 7:
            view_quality += 1

    # Ensure view_quality is within 1-10
    view_quality = max(1, min(10, view_quality))

    # Get famous occupant if exists
    famous_occupant = famous_people.get((layer, side, position), None)

    # Generate pros and cons
    pros = []
    cons = []

    if has_ac:
        pros.append("Air conditioning coverage")
    else:
        cons.append("No direct AC coverage")

    if view_quality >= 8:
        pros.append("Excellent view of the stage")
    elif view_quality >= 6:
        pros.append("Good view")
    elif view_quality <= 4:
        cons.append("Limited view from this angle")

    if seat_type == 'perpendicular_front':
        pros.append("Premium front row location")
        pros.append("Close to the main stage")

    if seat_type == 'regular_top' and layer <= 2:
        pros.append("Close proximity to the front")

    if seat_type == 'regular_bottom' and layer >= 14:
        cons.append("Further from the stage")

    # Position-based pros/cons
    if position in [1, 10]:
        pros.append("Aisle seat - easy access")
    elif 4 <= position <= 7:
        pros.append("Center position - balanced view")
    else:
        cons.append("Side position - may require turning to see")

    if side == 'left':
        pros.append("Left side seating")
    elif side == 'right':
        pros.append("Right side seating")

    if famous_occupant:
        pros.append("Historical significance")

    pros_text = "; ".join(pros) if pros else None
    cons_text = "; ".join(cons) if cons else None

    return has_ac, view_quality, famous_occupant, pros_text, cons_text

def populate_metadata(conn):
    """Populate the new columns with data"""
    cursor = conn.cursor()

    # Get all seats
    cursor.execute('SELECT id, layer, side, position, seat_type FROM seats')
    seats = cursor.fetchall()

    print(f"\nPopulating metadata for {len(seats)} seats...")

    updated = 0
    for seat in seats:
        seat_id, layer, side, position, seat_type = seat

        has_ac, view_quality, famous_occupant, pros, cons = get_seat_metadata(
            layer, side, position, seat_type
        )

        cursor.execute('''
            UPDATE seats
            SET has_ac = ?,
                view_quality = ?,
                famous_occupant = ?,
                pros = ?,
                cons = ?
            WHERE id = ?
        ''', (has_ac, view_quality, famous_occupant, pros, cons, seat_id))

        updated += 1
        if updated % 50 == 0:
            print(f"Updated {updated}/{len(seats)} seats...")

    conn.commit()
    print(f"✓ Successfully updated all {updated} seats with metadata")

def verify_migration(conn):
    """Verify the migration was successful"""
    cursor = conn.cursor()

    print("\n" + "="*60)
    print("MIGRATION VERIFICATION")
    print("="*60)

    # Check columns exist
    cursor.execute("PRAGMA table_info(seats)")
    columns = [row[1] for row in cursor.fetchall()]

    required_columns = ['has_ac', 'view_quality', 'famous_occupant', 'pros', 'cons']
    for col in required_columns:
        status = "✓" if col in columns else "✗"
        print(f"{status} Column '{col}' exists")

    # Show some sample data
    print("\n" + "="*60)
    print("SAMPLE DATA")
    print("="*60)

    cursor.execute('''
        SELECT id, layer, side, position, has_ac, view_quality,
               famous_occupant, pros, cons
        FROM seats
        WHERE famous_occupant IS NOT NULL
        LIMIT 5
    ''')

    print("\nSeats with famous occupants:")
    for row in cursor.fetchall():
        print(f"\nSeat ID {row[0]} (Layer {row[1]}, {row[2]}, Pos {row[3]}):")
        print(f"  AC: {'Yes' if row[4] else 'No'}")
        print(f"  View Quality: {row[5]}/10")
        print(f"  Famous: {row[6]}")
        print(f"  Pros: {row[7]}")
        print(f"  Cons: {row[8]}")

    # Show AC statistics
    cursor.execute('SELECT COUNT(*) FROM seats WHERE has_ac = 1')
    ac_count = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM seats')
    total_count = cursor.fetchone()[0]

    print(f"\n{ac_count}/{total_count} seats have AC coverage ({ac_count*100//total_count}%)")

    # Show view quality distribution
    print("\nView quality distribution:")
    cursor.execute('''
        SELECT view_quality, COUNT(*) as count
        FROM seats
        GROUP BY view_quality
        ORDER BY view_quality DESC
    ''')
    for row in cursor.fetchall():
        print(f"  Quality {row[0]}/10: {row[1]} seats")

def main():
    """Main migration function"""
    db_path = get_db_path()

    print("="*60)
    print("SEAT RECOMMENDATION MIGRATION")
    print("="*60)
    print(f"Database: {db_path}")
    print()

    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return

    # Connect to database
    conn = sqlite3.connect(db_path)

    try:
        # Step 1: Add columns
        print("Step 1: Adding new columns to seats table...")
        add_columns(conn)

        # Step 2: Populate metadata
        print("\nStep 2: Populating seat metadata...")
        populate_metadata(conn)

        # Step 3: Verify
        verify_migration(conn)

        print("\n" + "="*60)
        print("✓ MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*60)

    except Exception as e:
        print(f"\n✗ Error during migration: {e}")
        conn.rollback()
        raise

    finally:
        conn.close()

if __name__ == '__main__':
    main()
