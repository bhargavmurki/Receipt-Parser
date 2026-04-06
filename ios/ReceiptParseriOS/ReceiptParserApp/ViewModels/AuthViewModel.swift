import Foundation

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var fullName = ""
    @Published var isLoginMode = true
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var backendURL = AppConfiguration.currentBaseURLString()

    func submit(appViewModel: AppViewModel) async {
        isLoading = true
        errorMessage = nil

        do {
            if isLoginMode {
                let response = try await APIClient.shared.login(email: email, password: password)
                appViewModel.setSession(user: response.user, token: response.token)
                await appViewModel.refreshReceipts()
            } else {
                _ = try await APIClient.shared.register(name: fullName, email: email, password: password)
                isLoginMode = true
                password = ""
            }
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func continueLocally(appViewModel: AppViewModel) async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await APIClient.shared.developmentLogin()
            appViewModel.setSession(user: response.user, token: response.token)
            await appViewModel.refreshReceipts()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func saveBackendURL() {
        AppConfiguration.persistBaseURL(backendURL)
        backendURL = AppConfiguration.currentBaseURLString().hasSuffix("/")
            ? AppConfiguration.currentBaseURLString()
            : "\(AppConfiguration.currentBaseURLString())/"
    }
}
