import AuthenticationServices
import SwiftUI

struct AuthView: View {
    @EnvironmentObject private var appViewModel: AppViewModel
    @StateObject private var viewModel = AuthViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Receipt Parser")
                            .font(.largeTitle.bold())
                        Text("Scan receipts, review totals, and split costs in seconds.")
                            .foregroundStyle(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Backend URL")
                            .font(.headline)
                        TextField("https://your-tunnel-url/api", text: $viewModel.backendURL)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .keyboardType(.URL)
                            .textFieldStyle(.roundedBorder)

                        Button("Save Backend URL") {
                            viewModel.saveBackendURL()
                        }
                        .buttonStyle(.bordered)
                    }

                    SignInWithAppleButton(.signIn) { request in
                        request.requestedScopes = [.fullName, .email]
                    } onCompletion: { result in
                        Task {
                            await handleApple(result)
                        }
                    }
                    .signInWithAppleButtonStyle(.black)
                    .frame(height: 52)

                    VStack(spacing: 12) {
                        if !viewModel.isLoginMode {
                            TextField("Full Name", text: $viewModel.fullName)
                                .textFieldStyle(.roundedBorder)
                        }

                        TextField("Email", text: $viewModel.email)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .textFieldStyle(.roundedBorder)

                        SecureField("Password", text: $viewModel.password)
                            .textFieldStyle(.roundedBorder)
                    }

                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }

                    Button {
                        Task {
                            await viewModel.submit(appViewModel: appViewModel)
                        }
                    } label: {
                        if viewModel.isLoading {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                        } else {
                            Text(viewModel.isLoginMode ? "Sign In" : "Create Account")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)

                    Button {
                        Task {
                            await viewModel.continueLocally(appViewModel: appViewModel)
                        }
                    } label: {
                        Text("Continue Locally")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)

                    Button(viewModel.isLoginMode ? "Need an account? Register" : "Already have an account? Sign In") {
                        viewModel.isLoginMode.toggle()
                    }
                    .buttonStyle(.plain)
                }
                .padding(24)
            }
            .background(Color(.systemGroupedBackground))
        }
    }

    private func handleApple(_ result: Result<ASAuthorization, Error>) async {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let token = String(data: tokenData, encoding: .utf8) else {
                viewModel.errorMessage = "Failed to read Apple identity token."
                return
            }

            do {
                let response = try await APIClient.shared.loginWithApple(
                    identityToken: token,
                    firstName: credential.fullName?.givenName,
                    lastName: credential.fullName?.familyName
                )
                appViewModel.setSession(user: response.user, token: response.token)
                await appViewModel.refreshReceipts()
            } catch {
                viewModel.errorMessage = error.localizedDescription
            }
        case .failure(let error):
            viewModel.errorMessage = error.localizedDescription
        }
    }
}
