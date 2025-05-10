# iOS Workout Integration Guide

## Overview

This guide explains how to integrate workout data from your iOS app with the health stats platform. The backend now properly supports workout data from Apple HealthKit, storing all the relevant metrics and information about each workout session.

## Workout Data Format

The iOS app should send workout data in the following format:

```json
{
  "measurements": {
    "workout": [
      {
        "timestamp": "2023-05-20T08:30:00Z",   // Required - ISO 8601 timestamp
        "startDate": "2023-05-20T08:30:00Z",   // Required - When workout started
        "endDate": "2023-05-20T09:15:00Z",     // Required - When workout ended
        "activityType": "running",             // Required - Type of activity
        "duration": 2700,                      // Required - Duration in seconds
        "distance": 5.2,                       // Optional - Distance in kilometers
        "energyBurned": 450,                   // Optional - Calories burned
        "avgHeartRate": 145,                   // Optional - Average heart rate
        "maxHeartRate": 175,                   // Optional - Maximum heart rate
        "avgCadence": 160,                     // Optional - Average cadence
        "avgPace": 5.2,                        // Optional - Average pace
        "source": "Apple Health",              // Optional - Data source
        "value": 1                             // Required but not used
      }
    ]
  }
}
```

### Required Fields

- `timestamp`: ISO 8601 timestamp (used as the identifier)
- `startDate`: ISO 8601 timestamp when the workout started
- `endDate`: ISO 8601 timestamp when the workout ended 
- `activityType`: String representing the type of workout
- `duration`: Number representing duration in seconds
- `value`: Any number (required by the API but not used)

### Optional Fields

- `distance`: Number representing distance in kilometers
- `energyBurned`: Number representing calories burned
- `avgHeartRate`: Number representing average heart rate
- `maxHeartRate`: Number representing maximum heart rate
- `avgCadence`: Number representing average cadence
- `avgPace`: Number representing average pace
- `source`: String representing the data source (defaults to "iOS App")

### Activity Types

The following activity types are supported:

- `running`
- `walking`
- `cycling`
- `swimming`
- `hiit`
- `strength_training`
- `yoga`
- `pilates`
- `dance`
- `elliptical`
- `rowing`
- `stair_climbing`
- `hiking`
- `basketball`
- `soccer`
- `tennis`
- `golf`
- `other`

## Example Integration

```swift
func sendWorkoutData() {
    // Get workouts from HealthKit
    let workouts = fetchWorkoutsFromHealthKit()
    
    // Format for API
    let workoutMeasurements = workouts.map { workout -> [String: Any] in
        let startDate = workout.startDate
        let endDate = workout.endDate
        let duration = workout.duration
        
        var workoutData: [String: Any] = [
            "timestamp": startDate.iso8601String,
            "startDate": startDate.iso8601String,
            "endDate": endDate.iso8601String,
            "activityType": mapWorkoutType(workout.workoutActivityType),
            "duration": duration,
            "value": 1,  // Required placeholder value
            "source": "Apple Health"
        ]
        
        // Add optional fields if available
        if let distance = workout.totalDistance?.doubleValue(for: .meter()) {
            workoutData["distance"] = distance / 1000  // Convert to kilometers
        }
        
        if let calories = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) {
            workoutData["energyBurned"] = calories
        }
        
        // Add heart rate data if available
        // You'll need to implement the logic to extract heart rate from samples
        
        return workoutData
    }
    
    // Create request body
    let requestBody: [String: Any] = [
        "measurements": [
            "workout": workoutMeasurements
        ]
    ]
    
    // Send to API
    sendToApi(requestBody)
}

// Helper function to map HKWorkoutActivityType to our API format
func mapWorkoutType(_ type: HKWorkoutActivityType) -> String {
    switch type {
    case .running:
        return "running"
    case .walking:
        return "walking"
    case .cycling:
        return "cycling"
    case .traditionalStrengthTraining:
        return "strength_training"
    // Add other mappings as needed
    default:
        return "other"
    }
}
```

## How It Works

1. The iOS app collects workout data from HealthKit
2. The app formats and sends the data to the `/api/health-data/ios` endpoint
3. The server processes the data and stores it in the user's workout data file
4. Duplicate workouts (based on startDate) are automatically filtered out

## Viewing Workout Data

The workout data will be available in the dashboard in the activity feed. Each workout will display:
- Activity type
- Duration
- Distance (if applicable)
- Calories burned (if available)
- Date and time 