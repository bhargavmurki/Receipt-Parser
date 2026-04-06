import Foundation

@MainActor
final class ReceiptHistoryViewModel: ObservableObject {
    @Published var isRefreshing = false
    @Published var errorMessage: String?

    func refresh(appViewModel: AppViewModel) async {
        isRefreshing = true
        await appViewModel.refreshReceipts()
        errorMessage = appViewModel.errorMessage
        isRefreshing = false
    }

    func delete(_ receipt: Receipt, appViewModel: AppViewModel) async {
        guard let token = appViewModel.authStore.token else { return }

        do {
            try await APIClient.shared.deleteReceipt(id: receipt.id, token: token)
            appViewModel.removeReceipt(receipt)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
