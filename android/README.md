# Android App - MonkeySurvey

## Technology Stack
- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM (Model-View-ViewModel)
- **Networking**: Retrofit
- **Local Storage**: Room Database
- **Dependency Injection**: Hilt

## Project Structure
```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/monkeysurvey/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── data/
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── ApiService.kt
│   │   │   │   │   │   └── RetrofitClient.kt
│   │   │   │   │   ├── models/
│   │   │   │   │   │   ├── Survey.kt
│   │   │   │   │   │   ├── Question.kt
│   │   │   │   │   │   └── Response.kt
│   │   │   │   │   └── repository/
│   │   │   │   │       └── SurveyRepository.kt
│   │   │   │   ├── ui/
│   │   │   │   │   ├── screens/
│   │   │   │   │   │   ├── SurveyListScreen.kt
│   │   │   │   │   │   └── TakeSurveyScreen.kt
│   │   │   │   │   └── components/
│   │   │   │   │       └── QuestionItem.kt
│   │   │   │   └── viewmodels/
│   │   │   │       └── SurveyViewModel.kt
│   │   │   └── AndroidManifest.xml
│   │   └── res/
│   │       ├── values/
│   │       └── layout/
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

## Setup Instructions

### Prerequisites
- Android Studio Arctic Fox or newer
- JDK 11 or higher
- Android SDK (API Level 24 or higher)

### Steps

1. **Create New Project**
   ```bash
   # Open Android Studio
   # File -> New -> New Project
   # Select "Empty Compose Activity"
   # Package name: com.monkeysurvey
   # Minimum SDK: API 24
   ```

2. **Add Dependencies**
   
   In `app/build.gradle`:
   ```gradle
   dependencies {
       // Compose
       implementation 'androidx.compose.ui:ui:1.5.4'
       implementation 'androidx.compose.material3:material3:1.1.2'
       implementation 'androidx.navigation:navigation-compose:2.7.5'
       
       // Retrofit
       implementation 'com.squareup.retrofit2:retrofit:2.9.0'
       implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
       
       // Room
       implementation 'androidx.room:room-runtime:2.6.0'
       kapt 'androidx.room:room-compiler:2.6.0'
       
       // Hilt
       implementation 'com.google.dagger:hilt-android:2.48'
       kapt 'com.google.dagger:hilt-compiler:2.48'
       
       // ViewModel
       implementation 'androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2'
   }
   ```

3. **Configure API Client**
   
   Create `ApiService.kt`:
   ```kotlin
   interface ApiService {
       @GET("surveys")
       suspend fun getSurveys(): List<Survey>
       
       @GET("surveys/{id}")
       suspend fun getSurvey(@Path("id") id: String): Survey
       
       @POST("responses")
       suspend fun submitResponse(@Body response: SurveyResponse): ResponseResult
   }
   ```

4. **Build & Run**
   ```bash
   ./gradlew assembleDebug
   # Or use "Run" button in Android Studio
   ```

## Features to Implement

- [ ] Survey list screen with Material Design
- [ ] Survey detail/take survey screen
- [ ] Multiple question type renderers
- [ ] Form validation
- [ ] Offline support with Room
- [ ] Response submission
- [ ] Progress indicator
- [ ] Error handling

## API Integration

Base URL: `http://10.0.2.2:3000` (for emulator) or `http://localhost:3000` (for device)

Endpoints:
- GET `/surveys` - List all active surveys
- GET `/surveys/:id` - Get survey details
- POST `/responses` - Submit survey response

## Testing

```bash
./gradlew test
./gradlew connectedAndroidTest
```

## Build APK

```bash
./gradlew assembleRelease
```

APK will be generated at: `app/build/outputs/apk/release/`
