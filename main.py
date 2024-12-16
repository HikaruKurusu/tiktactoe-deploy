from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, emit

app = Flask(__name__)
CORS(app)  # Allow requests from all origins
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tictactoe.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow Socket.IO connections from all origins

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    wins = db.Column(db.Integer, default=0)
# Create the database tables
with app.app_context():
    db.create_all()

# Global variable to track waiting players
waiting_players = []

@app.route('/', methods=['GET'])
def hello_world():
    return "Hello, World!"

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password, password):
        return jsonify({'message': 'Login successful'}), 200
    return jsonify({'message': 'Invalid username or password'}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Basic validation
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    if len(username) < 3 or len(password) < 6:
        return jsonify({'message': 'Username must be at least 3 characters and password at least 6 characters'}), 400

    # Check if username already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400

    # Hash password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # Create new user
    user = User(username=username, password=hashed_password)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

# Socket.IO events for matchmaking and gameplay
@socketio.on('search_for_opponent')
def handle_search_for_opponent(data):
    username = data['username']
    
    if len(waiting_players) > 0:
        temp = waiting_players.pop()
        opponent = temp[0]  # Match with the first player in the waiting list
        room_name = f"game_{username}_{opponent}"
        join_room(room_name)
        emit('game_found', {'room': room_name, 'opponent': opponent}, to=request.sid)
        emit('game_found', {'room': room_name, 'opponent': username}, to=temp[1])
    else:
        waiting_players.append([username, request.sid])  # Add current user to waiting list

@socketio.on('update_board')
def handle_update_board(data):
    room = data['room']
    board = data['board']
    isXNext = data['isXNext']
    
    # Check if the room exists
    if room in socketio.server.manager.rooms['/']:
        # Get the list of clients in the room
        clients = socketio.server.manager.rooms['/'][room]
        print(f"Clients in room {room}: {clients}")
        
        # Emit the updated board to all clients in the room except the sender
        for sid in clients:
            if sid != request.sid:
                emit('game_update', {'board': board, 'isXNext': isXNext}, room=sid)
    else:
        print(f"Room {room} does not exist")

@socketio.on('join_room')
def handle_join_room(data):
    room = data['room']
    join_room(room)
    print(f"Client {request.sid} joined room {room}")

@socketio.on('disconnect')
def handle_disconnect():
    username = request.sid
    if username in waiting_players:
        waiting_players.remove(username)

@app.route('/api/user/<username>/points', methods=['GET'])
def get_user_points(username):
    user = User.query.filter_by(username=username).first()

    if user is None:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({'username': user.username, 'points': user.points})

# New API to set/update points of a user
@app.route('/api/user/<username>/points', methods=['POST'])
def set_user_points(username):
    user = User.query.filter_by(username=username).first()

    if user is None:
        return jsonify({'message': 'User not found'}), 404
    
    # Get the points to set from the request body
    new_points = request.json.get('points')
    
    if new_points is None or not isinstance(new_points, int):
        return jsonify({'message': 'Invalid points value'}), 400
    
    # Update the points
    user.points = new_points
    db.session.commit()

    return jsonify({'username': user.username, 'points': user.points})


if __name__ == '__main__':
    socketio.run(app, debug=True)