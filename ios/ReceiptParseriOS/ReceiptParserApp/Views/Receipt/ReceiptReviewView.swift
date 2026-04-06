import SwiftUI

struct ReceiptReviewView: View {
    @State private var draft: ReceiptDraft

    init(draft: ReceiptDraft) {
        _draft = State(initialValue: draft)
    }

    var body: some View {
        Form {
            Section("Receipt") {
                TextField("Merchant", text: $draft.name)
                DatePicker("Date", selection: $draft.date, displayedComponents: .date)
                decimalField("Subtotal", value: bindingOrZero($draft.subtotal))
                decimalField("Tax", value: bindingOrZero($draft.taxAmount))
                decimalField("Total", value: $draft.total)
            }

            Section("Items") {
                ForEach($draft.items) { $item in
                    VStack(alignment: .leading, spacing: 8) {
                        TextField("Description", text: $item.description)
                        HStack {
                            decimalField("Qty", value: $item.quantity)
                            decimalField("Price", value: $item.price)
                            decimalField("Total", value: $item.totalPrice)
                        }
                    }
                }
            }

            NavigationLink("Split This Receipt") {
                SplitView(viewModel: SplitViewModel(draft: draft))
            }
        }
        .navigationTitle("Review Receipt")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func decimalField(_ title: String, value: Binding<Double>) -> some View {
        VStack(alignment: .leading) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            TextField(title, value: value, format: .number.precision(.fractionLength(2)))
                .keyboardType(.decimalPad)
        }
    }

    private func bindingOrZero(_ source: Binding<Double?>) -> Binding<Double> {
        Binding<Double>(
            get: { source.wrappedValue ?? 0 },
            set: { source.wrappedValue = $0 }
        )
    }
}
