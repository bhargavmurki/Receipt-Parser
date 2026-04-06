import Foundation

@MainActor
final class AuthStore: ObservableObject {
    private let keychain = KeychainStore()
    private let tokenKey = "session-token"

    var token: String? {
        get { keychain.read(tokenKey) }
        set {
            if let newValue {
                try? keychain.save(newValue, for: tokenKey)
            } else {
                keychain.delete(tokenKey)
            }
        }
    }

    func clear() {
        token = nil
    }
}
