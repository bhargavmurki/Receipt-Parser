import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appViewModel: AppViewModel

    var body: some View {
        Group {
            switch appViewModel.state {
            case .launching:
                ProgressView("Loading Receipt Parser…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case .signedOut:
                AuthView()
            case .signedIn:
                MainTabView()
            }
        }
    }
}
