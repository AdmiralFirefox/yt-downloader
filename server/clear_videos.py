import os
import re

def delete_files_with_pattern(directory, pattern):
    regex = re.compile(pattern)
    
    # List all files in the directory
    for filename in os.listdir(directory):
        # Check if the pattern exists in the filename
        if regex.search(filename):
            file_path = os.path.join(directory, filename)
            
            # Delete the file
            try:
                os.remove(file_path)
                print(f"Deleted: {file_path}")
            except OSError as e:
                print(f"Error deleting {file_path}: {e}")
