from pyngrok import ngrok

# Open a HTTP tunnel on port 5678 (n8n default)
public_url = ngrok.connect(5678)

print("Public URL:", public_url)

# Keep the script running so tunnel stays alive
input("Press Enter to stop...\n")
