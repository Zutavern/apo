'use client'

import { UploadCloudIcon, X } from 'lucide-react'
import * as React from 'react'
import { useDropzone, type DropzoneOptions } from 'react-dropzone'
import { twMerge } from 'tailwind-merge'

const variants = {
  base: 'relative rounded-md flex justify-center items-center flex-col cursor-pointer min-h-[150px] min-w-[200px] border border-dashed border-gray-700 transition-colors duration-200 ease-in-out',
  image: 'border-0 p-0 min-h-0 min-w-0 relative shadow-md bg-gray-800 rounded-md',
  active: 'border-2',
  disabled: 'bg-gray-800 border-gray-700 cursor-default pointer-events-none bg-opacity-30',
  accept: 'border border-blue-500 bg-blue-500 bg-opacity-10',
  reject: 'border border-red-700 bg-red-700 bg-opacity-10',
}

type InputProps = {
  width?: number
  height?: number
  className?: string
  value?: File | string
  onChange?: (file?: File) => void | Promise<void>
  disabled?: boolean
  dropzoneOptions?: Omit<DropzoneOptions, 'disabled'>
}

const SingleImageDropzone = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { dropzoneOptions, width, height, value, className, disabled, onChange },
    ref,
  ) => {
    const imageUrl = React.useMemo(() => {
      if (typeof value === 'string') {
        return value
      } else if (value) {
        return URL.createObjectURL(value)
      }
      return null
    }, [value])

    const {
      getRootProps,
      getInputProps,
      acceptedFiles,
      fileRejections,
      isDragActive,
    } = useDropzone({
      accept: { 'image/*': [] },
      multiple: false,
      disabled,
      onDrop: (acceptedFiles) => {
        const file = acceptedFiles[0]
        if (file) {
          void onChange?.(file)
        }
      },
      ...dropzoneOptions,
    })

    const dropZoneClassName = React.useMemo(
      () =>
        twMerge(
          variants.base,
          isDragActive && variants.active,
          disabled && variants.disabled,
          imageUrl && variants.image,
          className,
        ),
      [isDragActive, disabled, imageUrl, className],
    )

    const renderPreview = () => {
      if (imageUrl) {
        return (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="object-cover rounded-md"
              src={imageUrl}
              alt={imageUrl}
              width={width}
              height={height}
              style={{
                width: width || '100%',
                height: height || '100%',
              }}
            />
            {!disabled && (
              <div className="group absolute top-0 left-0 w-full h-full rounded-md hover:bg-black/40 transition-colors">
                <button
                  type="button"
                  className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    void onChange?.(undefined)
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )
      }

      return (
        <div className="flex flex-col items-center justify-center text-xs text-gray-400">
          <UploadCloudIcon className="mb-2 h-7 w-7" />
          <div className="text-gray-400">Drag & Drop oder klicken</div>
        </div>
      )
    }

    return (
      <div>
        <div
          {...getRootProps({
            className: dropZoneClassName,
            style: {
              width,
              height,
            },
          })}
        >
          <input ref={ref} {...getInputProps()} />
          {renderPreview()}
        </div>

        {fileRejections?.[0] && (
          <div className="mt-1 text-xs text-red-500">
            {fileRejections[0].errors[0]?.message}
          </div>
        )}
      </div>
    )
  },
)
SingleImageDropzone.displayName = 'SingleImageDropzone'

export { SingleImageDropzone } 