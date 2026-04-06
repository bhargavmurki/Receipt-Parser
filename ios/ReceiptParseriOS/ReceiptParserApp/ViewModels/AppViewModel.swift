import Foundation

@MainActor
final class AppViewModel: ObservableObject {
    enum AppState {
        case launching
        case signedOut
        case signedIn
    }

    @Published private(set) var state: AppState = .launching
    @Published var currentUser: User?
    @Published var receipts: [Receipt] = []
    @Published var errorMessage: String?

    let authStore = AuthStore()
    private let receiptCache = ReceiptCache()

    func bootstrap() async {
        receipts = receiptCache.load()

        guard let token = authStore.token else {
            state = .signedOut
            return
        }

        do {
            currentUser = try await APIClient.shared.verify(token: token)
            receipts = try await APIClient.shared.fetchReceipts(token: token)
            receiptCache.save(receipts: receipts)
            state = .signedIn
        } catch {
            authStore.clear()
            state = .signedOut
        }
    }

    func setSession(user: User, token: String?) {
        currentUser = user
        if let token, !token.isEmpty {
            authStore.token = token
        }
        state = .signedIn
    }

    func refreshReceipts() async {
        guard let token = authStore.token else { return }
        do {
            receipts = try await APIClient.shared.fetchReceipts(token: token)
            receiptCache.save(receipts: receipts)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func upsertReceipt(_ receipt: Receipt) {
        receipts.removeAll { $0.id == receipt.id }
        receipts.insert(receipt, at: 0)
        receiptCache.save(receipts: receipts)
    }

    func removeReceipt(_ receipt: Receipt) {
        receipts.removeAll { $0.id == receipt.id }
        receiptCache.save(receipts: receipts)
    }

    func logout() async {
        if let token = authStore.token {
            try? await APIClient.shared.logout(token: token)
        }
        authStore.clear()
        currentUser = nil
        receipts = []
        receiptCache.clear()
        state = .signedOut
    }
}
