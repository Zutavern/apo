type MessageProps = {
  message: string
}

export function Message({ message }: MessageProps) {
  return message ? (
    <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20">
      {message}
    </div>
  ) : null
} 