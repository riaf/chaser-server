# CHaser Game Server

A TypeScript implementation of the CHaser programming game server with TCP/IP support.

## Overview

CHaser is a 1v1 programming game where two players compete to collect items on a grid-based map. This server implementation provides a complete TCP/IP interface following the CHaser protocol specification.

## Features

- **TCP/IP Protocol Support**: Separate ports for Cool (40000) and Hot (50000) players
- **Fixed Map Size**: 15x17 grid with point-symmetric item/block placement
- **Complete Game Logic**: Walk, put, look, and search actions with proper win/lose conditions
- **Protocol Compliance**: 10-digit surrounding information format
- **Test-Driven Development**: Comprehensive test suite with 51 tests
- **Clean Architecture**: Interface-based design for extensibility
- **Type Safety**: Full TypeScript implementation with strict type checking

## Game Rules

### Map Requirements
- Fixed size: 15 columns × 17 rows
- Minimum 36 items on the map
- Items and blocks must be placed in point-symmetric configuration
- Players start at opposite corners

### Actions
- **Walk (w)**: Move in specified direction (u/d/l/r)
- **Put (p)**: Place a block in specified direction
- **Look (l)**: Get information about cells in specified direction
- **Search (s)**: Get information about surrounding 9 cells

### Win/Lose Conditions
- **Win**: Successfully put a block on opponent's position
- **Lose**: Hit wall/block, get surrounded, disconnect, invalid command, or timeout
- **Draw**: Both players put blocks on each other simultaneously

## Installation

```bash
npm install
```

## Usage

### Start Server
```bash
npm run build
npm start
```

### Development Mode
```bash
npm run dev
```

### Run Tests
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

## Protocol Specification

### Connection Flow
1. Players connect to port 40000 (Cool) or 50000 (Hot)
2. Server sends "gr" to start game
3. Server sends 10-digit surrounding information
4. Player sends command (action + direction)
5. Server sends updated surrounding information
6. Repeat until game ends
7. Server sends "#" to end connection

### Surrounding Information Format
10-digit string representing the 3×3 grid around the player:
```
0 1 2
3 4 5
6 7 8
9 (player's item count)
```

Cell values:
- 0: Floor
- 1: Player
- 2: Block  
- 3: Item

### Command Format
Two characters: action + direction
- Actions: w(walk), p(put), l(look), s(search)
- Directions: u(up), d(down), l(left), r(right)

Example: "wu" = walk up, "pr" = put block right

## Architecture

### Core Components
- **MapManager**: Handles map loading, validation, and point-symmetry checking
- **GameLogic**: Implements game rules, actions, and win/lose conditions  
- **SurroundingInfoGenerator**: Generates 10-digit surrounding information
- **TCPConnectionHandler**: Manages TCP connections and message handling
- **CHaserServer**: Main server orchestration and game flow control

### Interfaces
- **IConnectionHandler**: Abstraction for different connection protocols
- **IGameLogger**: Abstraction for logging game events

This design allows easy extension to support other protocols (WebSocket, HTTP) by implementing the IConnectionHandler interface.

## Testing

The project includes comprehensive tests covering:
- Map validation (size, item count, point symmetry)
- Game logic (all actions, win/lose conditions)
- Protocol communication
- Integration scenarios

All tests follow TDD principles and maintain 100% pass rate.

## Dependencies

- **TypeScript**: Type-safe JavaScript
- **Vitest**: Fast testing framework
- **Biome**: Fast linting and formatting
- **tsx**: TypeScript execution for development

## License

ISC