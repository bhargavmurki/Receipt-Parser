import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var appViewModel: AppViewModel

    var body: some View {
        NavigationStack {
            List {
                Section("Account") {
                    if let user = appViewModel.currentUser {
                        LabeledContent("Name", value: user.name)
                        LabeledContent("Email", value: user.email ?? "Unavailable")
                        LabeledContent("Provider", value: user.provider ?? "Unknown")
                    }
                }

                Section("Environment") {
                    Text(AppEnvironment.shared.apiBaseURL.absoluteString)
                        .font(.footnote.monospaced())
                        .foregroundStyle(.secondary)
                }

                Section {
                    Button("Sign Out", role: .destructive) {
                        Task { await appViewModel.logout() }
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}
