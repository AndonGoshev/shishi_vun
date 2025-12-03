# Asensreshtupeevski - Project Reference

## Overview
Interactive React app called "asensreshtupeevski" with two main pages: a welcome page and an interactive game page.

## Project Structure

### Pages

#### 1. Welcome Page (`/`)
- Landing/welcome page
- Contains a button labeled "Правила" (Rules)
- When clicked, opens a modal with:
  - Rules information (to be filled in later)
  - A "Започни" (Start) button
- When "Започни" is clicked, navigates to `/app`

#### 2. Game Page (`/app`)
Interactive game with the following elements:

**Background:**
- Background image showing Bulgarian Parliament (image to be provided later)
- Image shows the parliament building in front view

**Game Elements:**
- **Person at bottom left**: A graphic of a person holding a rope
- **Rope**: A rope graphic that extends from the person at bottom left all the way to the parliament doors
- **Parliament doors**: Wide open doors showing black inside (dark opening)
- **Button**: "Дърпай!" (Pull!) button at the bottom center

**Game Mechanics:**
- On each click of "Дърпай!" button:
  - The rope shrinks/gets shorter
  - At the end of the rope, there's another person graphic
  - With each click, the person pulling (bottom left) pulls more and more
  - The person on the rope moves closer to the person pulling
- Eventually, the person on the rope ends up right next to the person pulling
- Final position: The person from the rope is positioned in the right corner next to the pulling person

## Technical Details

### Technologies
- React 18
- React Router DOM for navigation
- Vite as build tool

### Components
- `WelcomePage`: Main welcome/landing page
- `Modal`: Modal component for displaying rules
- `GamePage`: Interactive game page with rope pulling mechanics

### Future Development Notes
- Background image needs to be added (Bulgarian Parliament image)
- Rules content needs to be added to the modal
- Rope animation and person graphics may need refinement
- Final positioning logic for the person on the rope needs to be fine-tuned

