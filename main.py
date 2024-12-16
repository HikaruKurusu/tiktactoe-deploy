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

@app.route('/get_username_by_id', methods=['POST'])
def get_username_by_id():
    data = request.json
    userID = data.get('userID')
    user = User.query.filter_by(id=userID).first()

    if user:
        return jsonify({'username': user.username}), 200
    else:
        return jsonify({'message': 'User not found'}), 404


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password, password):
        return jsonify({'id': user.id, 'message': 'Login successful'}), 200
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
@socketio.on('search_for_opponent_by_id')
def handle_search_for_opponent_by_id(data):
    user_id = data['userID']

    user = User.query.get(user_id)  # Retrieve user by ID
    if not user:
        emit('error', {'message': 'User not found'}, to=request.sid)
        return

    username = user.username

    if len(waiting_players) > 0:
        opponent = waiting_players.pop()
        opponent_id, opponent_sid, opponent_username = opponent
        room_name = f"game_{user_id}_{opponent_id}"
        join_room(room_name)

        # Notify both players of the match
        emit('game_found', {'room': room_name, 'opponent': opponent_username}, to=request.sid)
        emit('game_found', {'room': room_name, 'opponent': username}, to=opponent_sid)
    else:
        waiting_players.append((user_id, request.sid, username))  # Add user to the queue



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