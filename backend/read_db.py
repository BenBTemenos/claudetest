#!/usr/bin/env python3
"""
Database Reader Script
View the contents of the seats.db database
"""

import sys
from database import Database

def print_separator():
    print("=" * 80)

def view_all_seats():
    """Display all seats"""
    db = Database()
    seats = db.get_all_seats()

    print_separator()
    print("ALL SEATS")
    print_separator()
    print(f"Total Seats: {len(seats)}\n")

    current_layer = None
    for seat in seats:
        if seat['layer'] != current_layer:
            current_layer = seat['layer']
            print(f"\n--- LAYER {current_layer} (${seat['price']}/year) ---")

        status = "AVAILABLE" if seat['is_available'] else f"BOOKED by {seat['user_name']}"
        print(f"  Seat #{seat['id']:3d} | {seat['side']:5s} | Position {seat['position']:2d} | {status}")

def view_available_seats():
    """Display only available seats"""
    db = Database()
    seats = db.get_all_seats()
    available = [s for s in seats if s['is_available'] == 1]

    print_separator()
    print("AVAILABLE SEATS")
    print_separator()
    print(f"Available: {len(available)} / {len(seats)}\n")

    by_layer = {}
    for seat in available:
        if seat['layer'] not in by_layer:
            by_layer[seat['layer']] = []
        by_layer[seat['layer']].append(seat)

    for layer in sorted(by_layer.keys()):
        seats_in_layer = by_layer[layer]
        print(f"Layer {layer} (${seats_in_layer[0]['price']}/year): {len(seats_in_layer)} available")

def view_bookings():
    """Display all bookings"""
    db = Database()
    bookings = db.get_all_bookings()

    print_separator()
    print("ALL BOOKINGS")
    print_separator()
    print(f"Total Bookings: {len(bookings)}\n")

    if bookings:
        for booking in bookings:
            print(f"Booking #{booking['id']}")
            print(f"  Seat: Layer {booking['layer']}, {booking['side']} side, Position {booking['position']}")
            print(f"  Price: ${booking['price']}/year")
            print(f"  Customer: {booking['user_name']} ({booking['user_email']})")
            print(f"  Booked: {booking['booking_date']}")
            print(f"  Status: {booking['payment_status']}")
            print()
    else:
        print("No bookings yet.\n")

def view_summary():
    """Display database summary"""
    db = Database()
    seats = db.get_all_seats()
    bookings = db.get_all_bookings()

    print_separator()
    print("DATABASE SUMMARY")
    print_separator()

    total_seats = len(seats)
    booked_seats = len([s for s in seats if s['is_available'] == 0])
    available_seats = total_seats - booked_seats

    print(f"Total Seats: {total_seats}")
    print(f"Available: {available_seats}")
    print(f"Booked: {booked_seats}")
    print(f"Occupancy Rate: {(booked_seats/total_seats*100):.1f}%")
    print()

    # Revenue calculation
    total_revenue = sum(s['price'] for s in seats if s['is_available'] == 0)
    potential_revenue = sum(s['price'] for s in seats)

    print(f"Annual Revenue (Booked): ${total_revenue:.2f}")
    print(f"Potential Revenue (All): ${potential_revenue:.2f}")
    print()

def main():
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()

        if command == "all":
            view_all_seats()
        elif command == "available":
            view_available_seats()
        elif command == "bookings":
            view_bookings()
        elif command == "summary":
            view_summary()
        else:
            print("Unknown command. Use: all, available, bookings, or summary")
    else:
        # Default: show summary
        view_summary()
        print("\nUsage:")
        print("  python3 read_db.py summary    - Show summary statistics")
        print("  python3 read_db.py all        - Show all seats")
        print("  python3 read_db.py available  - Show available seats")
        print("  python3 read_db.py bookings   - Show all bookings")

if __name__ == "__main__":
    main()
