# AI Salon Booker README

## The Challenge & The Goal

This project started as a challenge (see attached brief image): could I build an AI-powered voice agent in React Native to handle salon bookings naturally? The goal was to move beyond traditional booking forms, allowing users to simply ask for an appointment. I used React Native for the UI, Firebase for the backend and data, and Google's Gemini models (via Google AI Studio) for the AI brain.

## My Development Journey (The Ups and Downs!)

Building this was a significant learning curve, as both React Native and integrating LLMs were new territory for me. Here's how it unfolded:

* **Getting Started:** Began with a simple React Native app using dummy data just to find my feet.
* **Voice Input?** Tried some on-device speech-to-text tools, but accuracy wasn't great. Research pointed towards cloud-based solutions like Google's Text-to-Speech.
* **Finding a Backend:** Realized I'd need a backend for processing requests, which led me to Firebase.
* **First Chatbot Attempt:** Discovered a Firebase extension that sets up a basic chatbot with Firestore, Functions, and Gemini. It was a great intro to Google AI Studio but too limited for function calling or handling voice directly.
* **Chatbot V2 - Getting Serious:** Built a custom chatbot talking directly to the Gemini API. This meant:
    * Figuring out function calling in Google AI Studio.
    * Designing a proper data structure in Firestore (businesses, staff, services, bookings).
    * Adding manual booking features and Firebase Auth for user management.
    * (Also quickly built a profile editor when I needed a break from the chatbot!)
* **The LLM Struggle is Real:** V2 development hit a wall. The initial Gemini model (`gemini-pro` or `gemini-flash` - *adjust*) started hallucinating frequently and became unpredictable as I added more context and functions. It got *worse* with more detail, which was frustrating!
* **Model Upgrade & Chatbot V3:** Switched to a more advanced model (`gemini-1.5-pro` - *adjust*) after finding it handled complex instructions better in Google AI Studio. I decided to rebuild the chat (V3) with a simpler approach, focusing on just three key functions: getting business info, finding available slots, and confirming a booking.
* **Extra Features & Roadblocks:**
    * Tried using location data to find nearby salons, but the model wouldn't reliably use it (maybe a safety feature?).
    * Implemented payments, but couldn't get the LLM to trigger a payment popup securely. The solution: the chatbot makes the booking (unpaid) and tells the user to complete payment in their "My Bookings" area. Applied this to manual bookings too for consistency.
* **Testing Troubles:** Ran into issues mocking Firebase for tests. Since this is a PoC, I paused deep testing, but it's essential for a real product.

## How it Meets the Brief

* **Scan Slots:** Yes, via the `getAvailableSlots` function.
* **Check Staff/Branches:** Yes, checks staff availability based on the data. (Branch logic could be added).
* **Understand Commands:** The Gemini LLM interprets user requests for service, date, time, etc.
* **Secure Payments:** Handled indirectly – booking is separate from payment completion.

## Final Thoughts

This app is definitely a proof-of-concept. It works, and you can book an appointment via the chat (most of the time!), but the LLM can still hallucinate occasionally. The payment flow is a workaround. Despite the frustrations (especially with the LLM!), it was a fantastic challenge. I learned a ton about React Native, Firebase, and the practicalities (and quirks) of using LLMs.

---

# How to use

This React Native application uses Firebase, Google's Gemini models (via Google AI Studio), and Expo to create an AI-assisted chatbot for booking salon appointments.

## Getting Started

Follow these steps to set up and run the project locally.

**Prerequisites:**

* Node.js (LTS version recommended)
* npm or yarn
* An Android Emulator, iOS Simulator, or the Expo Go app on a physical device.

**Setup:**

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or: yarn install
    ```

3.  **Set up environment variables:**
    * Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    * Edit the `.env` file and add your Google Cloud API key. This key is used for interacting with Google AI Studio / Gemini models.
        ```dotenv
        # .env
        GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
        ```
    * **To get a Google Cloud API Key:**
        * Visit the [Google Cloud Console](https://console.cloud.google.com/).
        * Create a project or select an existing one.
        * Ensure the relevant APIs (like the Vertex AI API for Gemini) are enabled under "APIs & Services".
        * Create an API key under "APIs & Services" > "Credentials".
        * **Important:** Restrict your API key in the Google Cloud Console for security, limiting its usage to the necessary APIs and potentially IP addresses/app identifiers.
    * *(Add any other required environment variables here, e.g., Firebase config if needed)*

4.  **Start the app:**
    ```bash
    npx expo start
    ```

5.  **Run the app:**
    * Follow the instructions in the terminal output to open the app in your preferred environment:
        * Android Emulator/Device (Press `a`)
        * iOS Simulator/Device (Press `i`)
        * Web Browser (Press `w`)
        * Use the QR code with the Expo Go app on your physical device.

## Project Structure

* This project uses **file-based routing** via `expo-router`.
* Develop your screens and components within the `app` directory.