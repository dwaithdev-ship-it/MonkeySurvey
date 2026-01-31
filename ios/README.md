
# iOS App - BodhaSurvey

## Technology Stack
- **Language**: Swift
- **UI Framework**: SwiftUI
- **Architecture**: MVVM (Model-View-ViewModel)
- **Networking**: URLSession / Alamofire
- **Local Storage**: CoreData
- **Dependency Management**: Swift Package Manager

## Project Structure
```
ios/
├── BodhaSurvey/
│   ├── BodhaSurvey.xcodeproj
│   ├── BodhaSurvey/
│   │   ├── App/
│   │   │   ├── BodhaSurveyApp.swift
│   │   │   └── ContentView.swift
│   │   ├── Models/
│   │   │   ├── Survey.swift
│   │   │   ├── Question.swift
│   │   │   └── Response.swift
│   │   ├── Services/
│   │   │   ├── APIService.swift
│   │   │   └── NetworkManager.swift
│   │   ├── ViewModels/
│   │   │   └── SurveyViewModel.swift
│   │   ├── Views/
│   │   │   ├── SurveyListView.swift
│   │   │   ├── SurveyDetailView.swift
│   │   │   └── Components/
│   │   │       └── QuestionView.swift
│   │   └── CoreData/
│   │       └── BodhaSurvey.xcdatamodeld
│   └── Info.plist
└── Podfile (if using CocoaPods)
```

## Setup Instructions

### Prerequisites
- Xcode 15.0 or newer
- macOS Ventura or newer
- iOS 16.0+ target

### Steps

1. **Create New Project**
   ```bash
   # Open Xcode
   # File -> New -> Project
   # Select "App" under iOS
   # Interface: SwiftUI
   # Language: Swift
   ```

2. **Add Dependencies**
   
   Using Swift Package Manager in Xcode:
   ```
   File -> Add Packages
   
   Add:
   - Alamofire: https://github.com/Alamofire/Alamofire
   ```
   
   Or create `Podfile`:
   ```ruby
   platform :ios, '16.0'
   use_frameworks!
   
   target 'BodhaSurvey' do
     pod 'Alamofire', '~> 5.8'
   end
   ```

3. **Configure Info.plist**
   
   Add network permissions:
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
       <key>NSAllowsArbitraryLoads</key>
       <true/>
   </dict>
   ```

4. **Create API Service**
   
   Create `APIService.swift`:
   ```swift
   class APIService {
       static let shared = APIService()
       private let baseURL = "http://localhost:3000"
       
       func fetchSurveys() async throws -> [Survey] {
           let url = URL(string: "\(baseURL)/surveys")!
           let (data, _) = try await URLSession.shared.data(from: url)
           return try JSONDecoder().decode([Survey].self, from: data)
       }
       
       func submitResponse(_ response: SurveyResponse) async throws {
           let url = URL(string: "\(baseURL)/responses")!
           var request = URLRequest(url: url)
           request.httpMethod = "POST"
           request.httpBody = try JSONEncoder().encode(response)
           request.setValue("application/json", forHTTPHeaderField: "Content-Type")
           
           let (_, _) = try await URLSession.shared.data(for: request)
       }
   }
   ```

5. **Build & Run**
   ```bash
   # In Xcode: Product -> Build (⌘B)
   # Product -> Run (⌘R)
   ```

## Features to Implement

- [ ] Survey list view with native iOS design
- [ ] Survey detail/take survey view
- [ ] Multiple question type renderers
- [ ] Form validation
- [ ] Offline support with CoreData
- [ ] Response submission
- [ ] Progress indicator
- [ ] Error handling and alerts

## API Integration

Base URL: `http://localhost:3000` (use actual device IP for testing on device)

Endpoints:
- GET `/surveys` - List all active surveys
- GET `/surveys/:id` - Get survey details
- POST `/responses` - Submit survey response

## Testing

```bash
# Unit Tests
⌘U in Xcode

# UI Tests
Product -> Test (⌘U)
```

## Build IPA

1. Archive the app:
   ```
   Product -> Archive
   ```

2. Export IPA:
   ```
   Window -> Organizer
   Select archive -> Distribute App
   ```

## Deployment

### TestFlight
1. Upload to App Store Connect
2. Add internal/external testers
3. Submit for beta testing

### App Store
1. Complete App Store Connect information
2. Submit for review
3. Wait for approval
