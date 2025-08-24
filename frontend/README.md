# Cafe Customer Recognition Frontend

A modern React application for recognizing customers and managing a reward system. Customers get a free coffee every 5 visits.

## Features

- **Face Recognition**: Capture and recognize customers using webcam
- **Customer Registration**: Register new customers with face capture
- **Reward System**: Track visits and provide rewards every 5th visit
- **Checkout Process**: Complete transactions and record visits
- **Modern UI**: Beautiful, responsive design with animations

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on `http://127.0.0.1:8000`

## Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

The app will open at `http://localhost:3000`

## Usage

### For Cashiers/Staff:

1. **Customer Recognition**:
   - Customer positions their face in the camera
   - Click "Capture & Recognize" to identify the customer
   - If recognized, proceed to checkout
   - If not recognized, customer will be prompted to register

2. **New Customer Registration**:
   - Customer fills out registration form (name, email, address)
   - Captures their photo using the webcam
   - After registration, proceeds to checkout

3. **Checkout Process**:
   - View customer information and visit count
   - See progress toward next reward (free coffee every 5 visits)
   - Click "Complete Checkout" to record the visit
   - If eligible, customer gets a free coffee notification

### Reward System:

- Customers earn a **FREE COFFEE** every 5 visits
- Progress is tracked with a visual progress bar
- Special celebration when reward is earned
- Visit count is automatically incremented on checkout

## API Endpoints

The frontend communicates with these backend endpoints:

- `POST /recognize/` - Recognize customer by face
- `POST /register/` - Register new customer
- `POST /checkout/{user_id}/` - Complete checkout and record visit
- `GET /user/{user_id}` - Get user details

## Development

### Project Structure

```
src/
├── components/
│   ├── CameraCapture.tsx      # Face recognition component
│   ├── UserRegistration.tsx   # New customer registration
│   ├── CheckoutModal.tsx      # Checkout and reward display
│   └── *.css                  # Component styles
├── services/
│   └── api.ts                 # API communication
├── types.ts                   # TypeScript type definitions
└── App.tsx                    # Main application component
```

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App
- `npm run format` - Format all code with Prettier
- `npm run format:check` - Check code formatting without making changes

## Technologies Used

- **React 18** with TypeScript
- **React Webcam** for camera access
- **Axios** for API communication
- **CSS3** with modern animations and gradients
- **Responsive Design** for mobile and desktop

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

Note: Camera access requires HTTPS in production or localhost for development.

## Troubleshooting

### Camera Access Issues:

- Ensure the site is running on HTTPS or localhost
- Check browser permissions for camera access
- Try refreshing the page if camera doesn't load

### API Connection Issues:

- Verify backend is running on `http://127.0.0.1:8000`
- Check CORS settings in backend
- Ensure all required endpoints are available

### Build Issues:

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
