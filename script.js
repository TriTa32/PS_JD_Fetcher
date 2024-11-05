document.addEventListener('DOMContentLoaded', function() {
    const jobUrlInput = document.getElementById('jobUrl');
    const fetchButton = document.getElementById('fetchButton');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultSection = document.getElementById('resultSection');
    const errorMessage = document.getElementById('errorMessage');
    const jobTitle = document.getElementById('jobTitle');
    const companyName = document.getElementById('companyName');
    const locationElem = document.getElementById('location');
    const jobDescription = document.getElementById('jobDescription');

    fetchButton.addEventListener('click', handleFetchJob);
    jobUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleFetchJob();
        }
    });

    async function handleFetchJob() {
        const url = jobUrlInput.value.trim();
        
        if (!isValidUrl(url)) {
            showError('Please enter a valid URL');
            return;
        }

        try {
            showLoading(true);
            hideError();
            
            const response = await fetch('http://localhost:3000/fetch-job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            const result = await response.json();
            
            if (result.success) {
                displayJobData(result.data);
            } else {
                showError(result.error || 'Failed to fetch job details');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to connect to the server. Make sure the server is running.');
        } finally {
            showLoading(false);
        }
    }

    function displayJobData(data) {
        console.log('data:', data)
        jobTitle.textContent = data.title || 'No Title Available';
        companyName.textContent = data.company || 'Company Not Specified';
        locationElem.textContent = data.location || 'Location Not Specified';
        jobDescription.textContent = data.description || 'No Description Available';
        
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function showLoading(show) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
        fetchButton.disabled = show;
        jobUrlInput.disabled = show;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        resultSection.style.display = 'none';
    }

    function hideError() {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (err) {
            return false;
        }
    }
});