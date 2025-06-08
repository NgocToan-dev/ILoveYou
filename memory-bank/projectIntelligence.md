# Project Intelligence & Development Patterns

## Key Project Insights

### Couple-Centric Architecture Patterns
The ILoveYou app follows unique architectural patterns specifically designed for two-person usage:

1. **Shared Data Models**: All major features support both individual and couple-shared functionality
2. **Partner-Aware Components**: UI components understand relationship context
3. **Romantic Theming**: Consistent love-themed visual and interaction design
4. **Privacy-First Design**: Clear separation between private and shared content

### Critical Implementation Paths

#### Firebase Integration Pattern
```javascript
// Consistent error handling pattern used throughout
const { data, error } = await firebaseOperation();
if (error) {
  // Handle error with romantic messaging
} else {
  // Use data
}
```

#### Component Composition Strategy
- **Base Components**: [`LoveBackground`](src/components/ui/LoveBackground.js:1), [`LoveButton`](src/components/ui/LoveButton.js:1), [`LoveInput`](src/components/ui/LoveInput.js:1)
- **Composite Components**: Combine base components for feature-specific needs
- **Screen Components**: Use composition to build full screen experiences

### User Workflow Preferences

#### Navigation Patterns
- Users prefer bottom tab navigation over drawer navigation
- Quick access to frequently used features is essential
- Modal overlays work well for simple actions (quick notes, reminders)

#### Romantic User Experience Guidelines
- Error messages should maintain romantic tone: "Oops! Something went wrong 💔"
- Loading messages should be loving: "Loading your love story..."
- Success messages should celebrate: "Love grows stronger together! 💝"

### Technical Constraints & Solutions

#### React Native + Expo Limitations
- **File Upload**: Use Expo ImagePicker and MediaLibrary for media
- **Push Notifications**: Expo Notifications with proper permission handling
- **Background Tasks**: Limited background processing, rely on Firebase for server-side logic

#### Firebase Optimization Patterns
- **Real-time Listeners**: Only attach where necessary, always clean up
- **Query Efficiency**: Use composite indexes for complex queries
- **Security Rules**: User-based access control with couple sharing permissions

### Vietnamese Localization Requirements

#### Cultural Considerations
- **Formality Levels**: Support both formal and casual Vietnamese address
- **Romantic Expressions**: Use culturally appropriate terms of endearment
- **Family Context**: Recognize importance of extended family in Vietnamese culture
- **Traditional Values**: Respect traditional relationship milestones

#### Technical Implementation
- **i18n-js Library**: Preferred over react-native-localize for simplicity
- **Fallback Strategy**: Always fallback to English for missing translations
- **Dynamic Switching**: Allow language changes without app restart

## Feature-Specific Patterns

### Notes System Intelligence
- **Real-time Collaboration**: Use Firestore transactions for conflict resolution
- **Media Organization**: Organize by couple/note hierarchy in Firebase Storage
- **Category System**: Pre-defined categories with custom option for flexibility
- **Search Optimization**: Index title and content fields for efficient search

### Reminders System Intelligence
- **Notification Reliability**: Implement multiple fallback strategies
- **Recurring Logic**: Use cron-like patterns for complex recurring schedules
- **Partner Coordination**: Clear ownership and delegation patterns
- **Timezone Handling**: Store all times in UTC, display in user's timezone

### Peaceful Days Counter Intelligence
- **Simple Data Model**: Avoid over-engineering, keep counter logic simple
- **Partner Synchronization**: Require mutual agreement for resets
- **Milestone Celebrations**: Use animations and notifications for positive reinforcement
- **Historical Tracking**: Preserve data for relationship insights

## Development Workflow Patterns

### Code Organization Principles
1. **Feature-Based Structure**: Group related components, screens, and services
2. **Shared Components**: Maintain central component library with love theme
3. **Service Layer**: Abstract Firebase operations from UI components
4. **Consistent Naming**: Use romantic, couple-focused naming conventions

### Testing Strategies
- **Firebase Testing**: Use Firebase emulator for development and testing
- **Component Testing**: Focus on user interaction patterns
- **Integration Testing**: Test couple-specific workflows end-to-end
- **Cultural Testing**: Include Vietnamese speakers in testing process

### Performance Optimization
- **Lazy Loading**: Load screens and components as needed
- **Image Optimization**: Compress and cache images for better performance
- **Query Optimization**: Use pagination and efficient Firestore queries
- **Memory Management**: Proper cleanup of listeners and subscriptions

## Known Challenges & Solutions

### Real-time Sync Complexity
**Challenge**: Multiple users editing shared content simultaneously
**Solution**: Implement operational transforms or simple conflict resolution UI

### Cross-Platform Compatibility
**Challenge**: Ensuring consistent experience on iOS and Android
**Solution**: Extensive testing on both platforms, use platform-specific code sparingly

### Cultural Sensitivity
**Challenge**: Appropriate Vietnamese translation and cultural adaptation
**Solution**: Collaborate with native Vietnamese speakers and cultural experts

### Notification Reliability
**Challenge**: Push notifications don't always work reliably
**Solution**: Multiple notification channels (push, in-app, email fallback)

## Success Patterns

### User Engagement Drivers
1. **Daily Peaceful Days Counter**: Creates positive habit formation
2. **Shared Notes**: Encourages ongoing communication between partners
3. **Milestone Celebrations**: Provides positive reinforcement for relationship progress
4. **Quick Actions**: Easy access to frequently used features

### Technical Success Factors
1. **Consistent Error Handling**: Users always know what went wrong
2. **Offline Capability**: Basic functionality works without internet
3. **Fast Loading**: App launches quickly and responds immediately
4. **Romantic Design**: Visual design reinforces app's purpose and emotional connection

## Future Evolution Considerations

### Scalability Patterns
- Design for growth in couple count and data volume
- Consider premium features for monetization
- Plan for advanced relationship analytics and insights

### Community Features
- Anonymous couple community features
- Relationship challenges and activities
- Expert advice and coaching integration

### AI Integration Opportunities
- Smart reminder suggestions based on relationship patterns
- Mood analysis from note content
- Personalized relationship advice

## Development Team Guidelines

### Code Quality Standards
- Follow existing component patterns and naming conventions
- Maintain romantic tone in all user-facing text
- Ensure proper Firebase security rules for all new features
- Test thoroughly on both platforms before deployment

### Cultural Sensitivity Protocols
- All Vietnamese translations must be reviewed by native speakers
- Cultural context should be considered for all couple-related features
- Respect traditional relationship values while embracing modern technology

### Performance Requirements
- App launch time < 3 seconds
- Screen transitions < 500ms
- Image loading with proper placeholder states
- Efficient memory usage with proper cleanup

This project intelligence captures the unique aspects of building a couple-focused mobile application with cultural sensitivity and romantic user experience at its core.