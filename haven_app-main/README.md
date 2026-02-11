# Haven App

A React Native mobile app built with Expo for AR furniture placement and interior design visualization. Users can scan their space, place furniture models, take photos, and collaborate through comments on design projects.

## Features

- **AR Furniture Placement**: Place furniture models in your space using AR
- **Project Management**: Create and manage design projects with multiple scenes
- **Photo Capture**: Save snapshots of your AR designs to projects
- **Comment System**: Add comments and feedback on specific images and locations
- **Demo Projects**: Pre-loaded demo projects (Greg's House and Sera's Room) with sample images and comments

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**
- **npm**
- **Expo CLI**
- **iOS Development** (for iOS builds):
  - macOS
  - Xcode
  - CocoaPods

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/reidmccaw/haven_app.git
   cd haven_app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install iOS dependencies** (if building for iOS)
   ```bash
   cd ios
   pod install
   cd ..
   ```

## Running the App

### Development Mode

#### Start the Expo development server

```bash
npm start
```

### Using Expo Go Does Not Work For AR Features

**Important**: This app uses custom native modules (ViroReact for AR) that are **not compatible with Expo Go**. You must build a native app to use AR features.

The app will not load if launched with Expo Go.

## Building for Production

#### Local Build with Xcode

1. Generate native iOS project (if not already generated):

   ```bash
   npx expo prebuild --platform ios
   ```

2. Open in Xcode:

   ```bash
   open ios/Haven.xcworkspace
   ```

3. For physical device (iPhone):

   - Connect your iPhone to your Mac via USB cable
   - Trust the computer on your iPhone (if prompted)
   - In Xcode, select your connected device from the device dropdown
   - Select your development team
   - Click "Run" or press `Cmd + R`

**Note**: AR features require a physical device - the simulator does not have a camera.

## Key Technologies

- **React Native** (0.81.5)
- **Expo** (~54.0.23)
- **TypeScript**
- **ViroReact** (@reactvision/react-viro) - AR functionality
- **React Native AsyncStorage** - Local data persistence
- **Expo Camera** - Photo capture
- **Expo File System** - File management

## Demo Projects

The app automatically initializes two demo projects on first launch:

- **Greg's House** - Living room redesign with 4 demo images
- **Sera's Room** - Bedroom design with 2 demo images

These projects include pre-loaded comments for testing the comment and collaboration features.
