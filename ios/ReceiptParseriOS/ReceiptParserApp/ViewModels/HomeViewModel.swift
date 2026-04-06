import Foundation
import UIKit

@MainActor
final class HomeViewModel: ObservableObject {
    @Published var selectedImage: UIImage?
    @Published var isUploading = false
    @Published var uploadError: String?
    @Published var receiptDraft: ReceiptDraft?

    func handleScannedImage(_ image: UIImage) {
        selectedImage = image
    }

    func handlePhotoPickerData(_ data: Data?) {
        guard let data,
              let image = UIImage(data: data) else { return }

        selectedImage = image
    }

    func uploadSelectedImage(appViewModel: AppViewModel) async {
        guard let image = selectedImage,
              let token = appViewModel.authStore.token,
              let data = ImageProcessing.compressedJPEGData(from: image) else {
            uploadError = "Choose a receipt image before uploading."
            return
        }

        isUploading = true
        uploadError = nil

        do {
            let receipt = try await APIClient.shared.uploadReceipt(imageData: data, filename: "receipt.jpg", token: token)
            appViewModel.upsertReceipt(receipt)
            receiptDraft = ReceiptDraft(receipt: receipt)
        } catch {
            uploadError = error.localizedDescription
        }

        isUploading = false
    }
}
