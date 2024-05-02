document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Obter os dados dos carros e fuelTypes da API
        const carsResponse = await fetch('http://localhost:3000/cars');
        const fuelTypesResponse = await fetch('http://localhost:3000/fuelTypes');

        if (!carsResponse.ok || !fuelTypesResponse.ok) {
            throw new Error('Failed to fetch data from API');
        }

        const [carsData, fuelTypesData] = await Promise.all([
            carsResponse.json(),
            fuelTypesResponse.json()
        ]);

        // Mapear os carros por fuelType
        const carsByFuelType = {};
        carsData.forEach(car => {
            car.fuelTypes.forEach(fuelType => {
                if (!carsByFuelType[fuelType._id]) {
                    carsByFuelType[fuelType._id] = [];
                }
                carsByFuelType[fuelType._id].push(car);
            });
        });

        // Exibir os fuelTypes e os carros associados na lista
        const fuelTypeList = document.getElementById('fuelTypeList');
        fuelTypesData.forEach(fuelType => {
            const fuelTypeItem = document.createElement('div');
            fuelTypeItem.classList.add('fuelTypeItem');
            fuelTypeItem.innerHTML = `
                <h3>Fuel Type: ${fuelType.name} (ID: ${fuelType._id})</h3>
                <ul class="carList">
                    ${carsByFuelType[fuelType._id] ? 
                        carsByFuelType[fuelType._id].map(car => `<li class="carListItem">Car: ${car.name}</li>`).join('') : 
                        '<p class="noCars">No cars associated with this fuelType</p>'
                    }
                </ul>`;
            fuelTypeList.appendChild(fuelTypeItem);
        });

        // Criar o gráfico de barras para as marcas de carros
        const brands = carsData.map(car => car.brand);
        const brandCounts = {};
        brands.forEach(brand => {
            brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        });

        const ctx = document.getElementById('myChart').getContext('2d');
        const myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(brandCounts),
                datasets: [{
                    label: 'Numero de Carros Por Marca',
                    data: Object.values(brandCounts),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Criar o gráfico de pizza para a distribuição de carros por tipo de combustível
        const fuelTypeCounts = {};
        fuelTypesData.forEach(fuelType => {
            fuelTypeCounts[fuelType.name] = carsByFuelType[fuelType._id] ? carsByFuelType[fuelType._id].length : 0;
        });

        const ctxPie = document.getElementById('myPieChart').getContext('2d');
        const myPieChart = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: Object.keys(fuelTypeCounts),
                datasets: [{
                    label: 'Numero de Carros Por Tipo de Combustível',
                    data: Object.values(fuelTypeCounts),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                        'rgba(255, 159, 64, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

    } catch (error) {
        console.error('An error occurred:', error);
    }
});
