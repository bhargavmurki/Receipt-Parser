import SwiftUI

@main
struct ReceiptParserApp: App {
    @StateObject private var appViewModel = AppViewModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appViewModel)
                .task {
                    await appViewModel.bootstrap()
                }
        }
    }
}
