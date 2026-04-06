import Foundation

enum AppEnvironment {
    static let shared = AppConfiguration()
}

struct AppConfiguration {
    private static let userDefaultsKey = "receipt-parser-api-base-url"

    var apiBaseURL: URL {
        let configuredURL = Self.normalizedBaseURLString(Self.currentBaseURLString())

        guard let url = URL(string: configuredURL) else {
            fatalError("Invalid RECEIPT_PARSER_API_BASE_URL: \(configuredURL)")
        }

        return url
    }

    static func currentBaseURLString() -> String {
        UserDefaults.standard.string(forKey: userDefaultsKey)
            ?? ProcessInfo.processInfo.environment["RECEIPT_PARSER_API_BASE_URL"]
            ?? "http://localhost:5002/api"
    }

    static func persistBaseURL(_ value: String) {
        UserDefaults.standard.set(normalizedBaseURLString(value), forKey: userDefaultsKey)
    }

    private static func normalizedBaseURLString(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return trimmed }
        return trimmed.hasSuffix("/") ? trimmed : "\(trimmed)/"
    }
}
