import Foundation

final class ReceiptCache {
    private let fileURL: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(filename: String = "receipts-cache.json") {
        let directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
        fileURL = directory.appendingPathComponent(filename)
    }

    func save(receipts: [Receipt]) {
        guard let data = try? encoder.encode(receipts) else { return }
        try? data.write(to: fileURL, options: .atomic)
    }

    func load() -> [Receipt] {
        guard let data = try? Data(contentsOf: fileURL),
              let receipts = try? decoder.decode([Receipt].self, from: data) else {
            return []
        }
        return receipts
    }

    func clear() {
        try? FileManager.default.removeItem(at: fileURL)
    }
}
