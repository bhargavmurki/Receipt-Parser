import SwiftUI
import UIKit

struct SplitView: View {
    @StateObject var viewModel: SplitViewModel
    @State private var shareText = ""
    @State private var showsShareSheet = false

    var body: some View {
        List {
            Section("People") {
                ForEach(Array(viewModel.participants.enumerated()), id: \.offset) { index, _ in
                    HStack {
                        TextField("Person \(index + 1)", text: Binding(
                            get: { viewModel.participants[index] },
                            set: { viewModel.updateParticipant($0, at: index) }
                        ))

                        if viewModel.participants.count > 1 {
                            Button(role: .destructive) {
                                viewModel.removeParticipant(at: index)
                            } label: {
                                Image(systemName: "trash")
                            }
                        }
                    }
                }

                Button("Add Person") {
                    viewModel.addParticipant()
                }
            }

            Section("Assign Items") {
                ForEach(viewModel.draft.items) { item in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(item.description)
                            .font(.headline)
                        Text(item.totalPrice, format: .currency(code: "USD"))
                            .foregroundStyle(.secondary)

                        ForEach(Array(viewModel.participants.enumerated()), id: \.offset) { index, participant in
                            Button {
                                viewModel.toggleParticipant(index: index, for: item)
                            } label: {
                                HStack {
                                    Text(participant.isEmpty ? "Person \(index + 1)" : participant)
                                    Spacer()
                                    if viewModel.assignments[item.id, default: []].contains(index) {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(.blue)
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 8)
                }
            }

            Section("Totals") {
                ForEach(viewModel.totals, id: \.name) { total in
                    HStack {
                        Text(total.name)
                        Spacer()
                        Text(total.amount, format: .currency(code: "USD"))
                    }
                }

                Button("Share Summary") {
                    shareText = viewModel.shareSummary
                    showsShareSheet = true
                }
                .disabled(viewModel.totals.isEmpty)
            }
        }
        .navigationTitle("Split Receipt")
        .sheet(isPresented: $showsShareSheet) {
            ShareSheet(items: [shareText])
        }
    }
}

private struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
