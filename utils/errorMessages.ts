export function getReadableErrorMessage(errorString: string): string {

    console.log('error', errorString);

    // If it's a Firebase error (starts with "Firebase:")
    if (errorString.startsWith('Firebase:')) {
        // Auth errors
        if (errorString.includes('auth/invalid-email')) {
            return 'Please enter a valid email address';
        }
        if (errorString.includes('auth/user-disabled')) {
            return 'This account has been disabled. Please contact support';
        }
        if (errorString.includes('auth/user-not-found')) {
            return 'No account found with this email. Please sign up first';
        }
        if (errorString.includes('auth/wrong-password')) {
            return 'Incorrect password. Please try again';
        }
        if (errorString.includes('auth/email-already-in-use')) {
            return 'An account with this email already exists. Please sign in instead';
        }
        if (errorString.includes('auth/weak-password')) {
            return 'Password should be at least 6 characters long';
        }
        if (errorString.includes('auth/network-request-failed')) {
            return 'Network error. Please check your connection and try again';
        }
        if (errorString.includes('auth/too-many-requests')) {
            return 'Too many attempts. Please try again later';
        }
        if (errorString.includes('auth/operation-not-allowed')) {
            return 'This sign-in method is not enabled. Please try another method';
        }
        if (errorString.includes('auth/popup-closed-by-user')) {
            return 'Sign-in was cancelled. Please try again';
        }
        if (errorString.includes('auth/cancelled-popup-request')) {
            return 'Sign-in was cancelled. Please try again';
        }
        if (errorString.includes('auth/popup-blocked')) {
            return 'Pop-up was blocked. Please allow pop-ups and try again';
        }
        if (errorString.includes('auth/account-exists-with-different-credential')) {
            return 'An account already exists with the same email but different sign-in credentials';
        }
        if (errorString.includes('auth/requires-recent-login')) {
            return 'Please sign in again to complete this action';
        }
        if (errorString.includes('auth/invalid-credential')) {
            return 'Invalid credentials. Please try again';
        }
        if (errorString.includes('auth/invalid-verification-code')) {
            return 'Invalid verification code. Please try again';
        }
        if (errorString.includes('auth/invalid-verification-id')) {
            return 'Invalid verification ID. Please try again';
        }
        if (errorString.includes('auth/captcha-check-failed')) {
            return 'Verification failed. Please try again';
        }
        if (errorString.includes('auth/invalid-phone-number')) {
            return 'Invalid phone number. Please try again';
        }
        if (errorString.includes('auth/missing-phone-number')) {
            return 'Please enter a phone number';
        }
        if (errorString.includes('auth/quota-exceeded')) {
            return 'Quota exceeded. Please try again later';
        }
        if (errorString.includes('auth/rejected-credential')) {
            return 'Sign-in was rejected. Please try again';
        }
        if (errorString.includes('auth/missing-or-invalid-nonce')) {
            return 'Invalid request. Please try again';
        }
        if (errorString.includes('auth/app-deleted')) {
            return 'This app has been deleted. Please contact support';
        }
        if (errorString.includes('auth/app-not-authorized')) {
            return 'This app is not authorised. Please contact support';
        }
        if (errorString.includes('auth/argument-error')) {
            return 'Invalid argument. Please try again';
        }
        if (errorString.includes('auth/invalid-api-key')) {
            return 'Invalid API key. Please contact support';
        }
        if (errorString.includes('auth/invalid-user-token')) {
            return 'Your session has expired. Please sign in again';
        }
        if (errorString.includes('auth/invalid-tenant-id')) {
            return 'Invalid tenant ID. Please contact support';
        }
        if (errorString.includes('auth/unauthorized-domain')) {
            return 'This domain is not authorised. Please contact support';
        }
        if (errorString.includes('auth/user-token-expired')) {
            return 'Your session has expired. Please sign in again';
        }
        if (errorString.includes('auth/web-storage-unsupported')) {
            return 'Web storage is not supported. Please try another browser';
        }
        
        // Default for Firebase errors if no specific code matched
        return 'An unexpected authentication error occurred. Please try again';
    }

    // For general errors, return the error message or a default message
    return errorString || 'An unexpected error occurred. Please try again';
}