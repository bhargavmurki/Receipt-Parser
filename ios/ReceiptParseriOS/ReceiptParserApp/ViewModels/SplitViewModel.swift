import Foundation

@MainActor
final class SplitViewModel: ObservableObject {
    @Published var participants: [String] = [""]
    @Published var assignments: [UUID: Set<Int>] = [:]

    let draft: ReceiptDraft

    init(draft: ReceiptDraft) {
        self.draft = draft
    }

    func toggleParticipant(index: Int, for item: ReceiptItem) {
        var current = assignments[item.id, default: []]
        if current.contains(index) {
            current.remove(index)
        } else {
            current.insert(index)
        }
        assignments[item.id] = current
    }

    func updateParticipant(_ name: String, at index: Int) {
        guard participants.indices.contains(index) else { return }
        participants[index] = name
    }

    func addParticipant() {
        participants.append("")
    }

    func removeParticipant(at index: Int) {
        guard participants.count > 1 else { return }
        participants.remove(at: index)
        assignments = assignments.mapValues { indices in
            Set(indices.compactMap { value in
                if value == index { return nil }
                return value > index ? value - 1 : value
            })
        }
    }

    var totals: [(name: String, amount: Double)] {
        var ledger: [String: Double] = [:]

        for item in draft.items {
            let selected = assignments[item.id, default: []]
            guard !selected.isEmpty else { continue }

            let splitAmount = item.totalPrice / Double(selected.count)
            for index in selected {
                let name = participants[index].isEmpty ? "Person \(index + 1)" : participants[index]
                ledger[name, default: 0] += splitAmount
            }
        }

        return ledger
            .sorted { $0.key < $1.key }
            .map { (name: $0.key, amount: $0.value) }
    }

    var shareSummary: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"

        let lines = totals.map { entry in
            let amount = formatter.string(from: NSNumber(value: entry.amount)) ?? "$0.00"
            return "\(entry.name): \(amount)"
        }

        return ([draft.name, "Split Summary"] + lines).joined(separator: "\n")
    }
}
