import SwiftUI

struct ReceiptHistoryView: View {
    @EnvironmentObject private var appViewModel: AppViewModel
    @StateObject private var viewModel = ReceiptHistoryViewModel()

    var body: some View {
        NavigationStack {
            List {
                ForEach(appViewModel.receipts) { receipt in
                    NavigationLink {
                        ReceiptDetailView(receipt: receipt)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(receipt.name)
                                .font(.headline)
                            Text(receipt.date)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Text(receipt.total, format: .currency(code: "USD"))
                                .font(.subheadline.weight(.semibold))
                        }
                    }
                    .swipeActions {
                        Button(role: .destructive) {
                            Task { await viewModel.delete(receipt, appViewModel: appViewModel) }
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                }
            }
            .overlay {
                if appViewModel.receipts.isEmpty {
                    ContentUnavailableView("No Receipts Yet", systemImage: "doc.text.image", description: Text("Scan or import a receipt to start splitting."))
                }
            }
            .navigationTitle("Receipts")
            .refreshable {
                await viewModel.refresh(appViewModel: appViewModel)
            }
        }
    }
}
