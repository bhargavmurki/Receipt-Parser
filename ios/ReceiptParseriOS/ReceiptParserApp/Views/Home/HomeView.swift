import PhotosUI
import SwiftUI
import UIKit
import VisionKit

struct HomeView: View {
    @EnvironmentObject private var appViewModel: AppViewModel
    @StateObject private var viewModel = HomeViewModel()
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var showsScanner = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Scan and Split")
                        .font(.largeTitle.bold())

                    Text("Capture a new receipt or import one from your photo library.")
                        .foregroundStyle(.secondary)

                    VStack(spacing: 16) {
                        Button {
                            showsScanner = true
                        } label: {
                            ActionCard(title: "Scan Receipt", subtitle: "Use the camera to capture a paper receipt.", systemImage: "camera")
                        }
                        .buttonStyle(.plain)

                        PhotosPicker(selection: $selectedPhoto, matching: .images) {
                            ActionCard(title: "Import from Photos", subtitle: "Upload an existing receipt image from your library.", systemImage: "photo.on.rectangle")
                        }
                        .buttonStyle(.plain)
                    }

                    if let selectedImage = viewModel.selectedImage {
                        VStack(alignment: .leading, spacing: 12) {
                            Image(uiImage: selectedImage)
                                .resizable()
                                .scaledToFit()
                                .clipShape(RoundedRectangle(cornerRadius: 18))

                            Button {
                                Task {
                                    await viewModel.uploadSelectedImage(appViewModel: appViewModel)
                                }
                            } label: {
                                if viewModel.isUploading {
                                    ProgressView()
                                        .frame(maxWidth: .infinity)
                                } else {
                                    Text("Process Receipt")
                                        .frame(maxWidth: .infinity)
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                        }
                    }

                    if let error = viewModel.uploadError {
                        Text(error)
                            .foregroundStyle(.red)
                    }
                }
                .padding(24)
            }
            .navigationDestination(
                isPresented: Binding(
                    get: { viewModel.receiptDraft != nil },
                    set: { isPresented in
                        if !isPresented {
                            viewModel.receiptDraft = nil
                        }
                    }
                )
            ) {
                if let draft = viewModel.receiptDraft {
                    ReceiptReviewView(draft: draft)
                } else {
                    EmptyView()
                }
            }
            .sheet(isPresented: $showsScanner) {
                DocumentScannerView { image in
                    viewModel.handleScannedImage(image)
                }
            }
            .onChange(of: selectedPhoto) { _, newValue in
                Task {
                    let data = try? await newValue?.loadTransferable(type: Data.self)
                    viewModel.handlePhotoPickerData(data)
                }
            }
        }
    }
}

private struct ActionCard: View {
    let title: String
    let subtitle: String
    let systemImage: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: systemImage)
                .font(.title2)
                .frame(width: 48, height: 48)
                .background(.blue.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.headline)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding(18)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }
}

private struct DocumentScannerView: UIViewControllerRepresentable {
    let onScan: (UIImage) -> Void
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let controller = VNDocumentCameraViewController()
        controller.delegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ uiViewController: VNDocumentCameraViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onScan: onScan, dismiss: dismiss)
    }

    final class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {
        let onScan: (UIImage) -> Void
        let dismiss: DismissAction

        init(onScan: @escaping (UIImage) -> Void, dismiss: DismissAction) {
            self.onScan = onScan
            self.dismiss = dismiss
        }

        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
            if scan.pageCount > 0 {
                onScan(scan.imageOfPage(at: 0))
            }
            dismiss()
        }

        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
            dismiss()
        }

        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
            dismiss()
        }
    }
}
