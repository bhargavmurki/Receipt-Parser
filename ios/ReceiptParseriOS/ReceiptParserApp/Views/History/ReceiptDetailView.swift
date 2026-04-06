import SwiftUI

struct ReceiptDetailView: View {
    let receipt: Receipt

    var body: some View {
        List {
            Section("Summary") {
                LabeledContent("Merchant", value: receipt.name)
                LabeledContent("Date", value: receipt.date)
                LabeledContent("Total", value: receipt.total.formatted(.currency(code: "USD")))
                if let subtotal = receipt.subtotal {
                    LabeledContent("Subtotal", value: subtotal.formatted(.currency(code: "USD")))
                }
                if let taxAmount = receipt.taxAmount {
                    LabeledContent("Tax", value: taxAmount.formatted(.currency(code: "USD")))
                }
            }

            Section("Items") {
                ForEach(receipt.items) { item in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.description)
                        Text(item.totalPrice, format: .currency(code: "USD"))
                            .foregroundStyle(.secondary)
                    }
                }
            }

            NavigationLink("Split Again") {
                SplitView(viewModel: SplitViewModel(draft: ReceiptDraft(receipt: receipt)))
            }
        }
        .navigationTitle("Receipt Detail")
        .navigationBarTitleDisplayMode(.inline)
    }
}
